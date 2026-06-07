package services

import (
	"community-reservelink/internal/config"
	"community-reservelink/internal/models"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StatsService struct {
	db *gorm.DB
}

func NewStatsService() *StatsService {
	return &StatsService{
		db: config.GetDB(),
	}
}

type DashboardStats struct {
	TotalUsers       int64 `json:"total_users"`
	TotalCommunities int64 `json:"total_communities"`
	TotalSupplies    int64 `json:"total_supplies"`
	TotalBorrows     int64 `json:"total_borrows"`
	ActiveAlerts     int64 `json:"active_alerts"`
	TodayBorrows     int64 `json:"today_borrows"`
	TodayReturns     int64 `json:"today_returns"`
	AvailableSupplies int64 `json:"available_supplies"`
}

type ContributionItem struct {
	UserID      uuid.UUID `json:"user_id"`
	Username    string    `json:"username"`
	Avatar      string    `json:"avatar"`
	TotalPoints int       `json:"total_points"`
	Rank        int       `json:"rank"`
}

type MutualAidReport struct {
	TotalBorrowRequests   int64  `json:"total_borrow_requests"`
	ApprovedRequests      int64  `json:"approved_requests"`
	CompletedRequests     int64  `json:"completed_requests"`
	RejectedRequests      int64  `json:"rejected_requests"`
	ApprovalRate          string `json:"approval_rate"`
	CompletionRate        string `json:"completion_rate"`
	TotalSuppliesShared   int64  `json:"total_supplies_shared"`
	UniqueParticipants    int64  `json:"unique_participants"`
	AverageRating         string `json:"average_rating"`
	Period                string `json:"period"`
}

func (s *StatsService) GetDashboardStats(communityID uuid.UUID) (*DashboardStats, error) {
	var stats DashboardStats
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	userQuery := s.db.Model(&models.User{})
	communityQuery := s.db.Model(&models.Community{})
	supplyQuery := s.db.Model(&models.Supply{})
	borrowQuery := s.db.Model(&models.BorrowRequest{})
	alertQuery := s.db.Model(&models.Alert{})

	if communityID != uuid.Nil {
		var memberIDs []uuid.UUID
		s.db.Model(&models.CommunityMember{}).Where("community_id = ?", communityID).Pluck("user_id", &memberIDs)

		if len(memberIDs) > 0 {
			userQuery = userQuery.Where("id IN ?", memberIDs)
			supplyQuery = supplyQuery.Where("owner_id IN ?", memberIDs)
			borrowQuery = borrowQuery.Where("borrower_id IN ? OR owner_id IN ?", memberIDs, memberIDs)
		}

		alertQuery = alertQuery.Where("community_id = ?", communityID)
		communityQuery = communityQuery.Where("id = ?", communityID)
	}

	userQuery.Count(&stats.TotalUsers)
	communityQuery.Count(&stats.TotalCommunities)
	supplyQuery.Count(&stats.TotalSupplies)
	borrowQuery.Count(&stats.TotalBorrows)
	alertQuery.Where("status = ?", "active").Count(&stats.ActiveAlerts)
	supplyQuery.Where("status = ? AND available > ?", "available", 0).Count(&stats.AvailableSupplies)

	borrowQuery.Where("created_at >= ?", todayStart).Count(&stats.TodayBorrows)
	borrowQuery.Where("returned_at >= ?", todayStart).Count(&stats.TodayReturns)

	return &stats, nil
}

func (s *StatsService) GetContributionRank(communityID uuid.UUID, limit int) ([]ContributionItem, error) {
	type result struct {
		UserID      uuid.UUID
		Username    string
		Avatar      string
		TotalPoints int
	}

	var results []result

	query := s.db.Table("contributions").
		Select("user_id, users.username, users.avatar, SUM(points) as total_points").
		Joins("JOIN users ON users.id = contributions.user_id")

	if communityID != uuid.Nil {
		query = query.Where("community_id = ?", communityID)
	}

	err := query.Group("user_id, users.username, users.avatar").
		Order("total_points DESC").
		Limit(limit).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var items []ContributionItem
	for i, r := range results {
		items = append(items, ContributionItem{
			UserID:      r.UserID,
			Username:    r.Username,
			Avatar:      r.Avatar,
			TotalPoints: r.TotalPoints,
			Rank:        i + 1,
		})
	}

	return items, nil
}

func (s *StatsService) GetMutualAidReport(communityID uuid.UUID, startDate, endDate time.Time) (*MutualAidReport, error) {
	var report MutualAidReport
	report.Period = startDate.Format("2006-01-02") + " 至 " + endDate.Format("2006-01-02")

	query := s.db.Model(&models.BorrowRequest{})

	if communityID != uuid.Nil {
		var memberIDs []uuid.UUID
		s.db.Model(&models.CommunityMember{}).Where("community_id = ?", communityID).Pluck("user_id", &memberIDs)
		if len(memberIDs) > 0 {
			query = query.Where("(borrower_id IN ? OR owner_id IN ?) AND created_at >= ? AND created_at <= ?",
				memberIDs, memberIDs, startDate, endDate)
		}
	} else {
		query = query.Where("created_at >= ? AND created_at <= ?", startDate, endDate)
	}

	var allBorrows []models.BorrowRequest
	query.Find(&allBorrows)

	report.TotalBorrowRequests = int64(len(allBorrows))

	for _, b := range allBorrows {
		switch b.Status {
		case "approved", "picked_up":
			report.ApprovedRequests++
		case "returned":
			report.ApprovedRequests++
			report.CompletedRequests++
		case "rejected":
			report.RejectedRequests++
		}
	}

	if report.TotalBorrowRequests > 0 {
		approvalRate := float64(report.ApprovedRequests) / float64(report.TotalBorrowRequests) * 100
		report.ApprovalRate = formatPercentage(approvalRate)

		completionRate := float64(report.CompletedRequests) / float64(report.ApprovedRequests) * 100
		report.CompletionRate = formatPercentage(completionRate)
	}

	var totalQuantity int64
	s.db.Model(&models.BorrowRequest{}).
		Where("status = ? AND created_at >= ? AND created_at <= ?", "returned", startDate, endDate).
		Select("COALESCE(SUM(quantity), 0)").Scan(&totalQuantity)
	report.TotalSuppliesShared = totalQuantity

	var borrowerIDs []uuid.UUID
	var ownerIDs []uuid.UUID
	s.db.Model(&models.BorrowRequest{}).Where("created_at >= ? AND created_at <= ?", startDate, endDate).Pluck("DISTINCT borrower_id", &borrowerIDs)
	s.db.Model(&models.BorrowRequest{}).Where("created_at >= ? AND created_at <= ?", startDate, endDate).Pluck("DISTINCT owner_id", &ownerIDs)

	uniqueMap := make(map[uuid.UUID]bool)
	for _, id := range borrowerIDs {
		uniqueMap[id] = true
	}
	for _, id := range ownerIDs {
		uniqueMap[id] = true
	}
	report.UniqueParticipants = int64(len(uniqueMap))

	var avgRating float64
	s.db.Model(&models.BorrowRequest{}).
		Where("rating > 0 AND created_at >= ? AND created_at <= ?", startDate, endDate).
		Select("COALESCE(AVG(rating), 0)").Scan(&avgRating)
	report.AverageRating = formatFloat(avgRating, 1)

	return &report, nil
}

func formatPercentage(value float64) string {
	return formatFloat(value, 1) + "%"
}

func formatFloat(value float64, precision int) string {
	format := "%." + string(rune('0'+precision)) + "f"
	return sprintf(format, value)
}

func sprintf(format string, args ...interface{}) string {
	return fmt.Sprintf(format, args...)
}
