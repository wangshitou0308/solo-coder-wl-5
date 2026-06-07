package handlers

import (
	"community-reservelink/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StatsHandler struct {
	statsService *services.StatsService
}

func NewStatsHandler() *StatsHandler {
	return &StatsHandler{
		statsService: services.NewStatsService(),
	}
}

func (h *StatsHandler) GetDashboard(c *gin.Context) {
	communityIDStr := c.Query("community_id")
	var communityID uuid.UUID
	if communityIDStr != "" {
		communityID, _ = uuid.Parse(communityIDStr)
	}

	stats, err := h.statsService.GetDashboardStats(communityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *StatsHandler) GetContributionRank(c *gin.Context) {
	communityIDStr := c.Query("community_id")
	var communityID uuid.UUID
	if communityIDStr != "" {
		communityID, _ = uuid.Parse(communityIDStr)
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	rank, err := h.statsService.GetContributionRank(communityID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rank})
}

func (h *StatsHandler) GetMutualAidReport(c *gin.Context) {
	communityIDStr := c.Query("community_id")
	var communityID uuid.UUID
	if communityIDStr != "" {
		communityID, _ = uuid.Parse(communityIDStr)
	}

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	var startDate, endDate time.Time
	var err error

	if startDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			startDate = time.Now().AddDate(0, -1, 0)
		}
	} else {
		startDate = time.Now().AddDate(0, -1, 0)
	}

	if endDateStr != "" {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			endDate = time.Now()
		}
	} else {
		endDate = time.Now()
	}

	report, err := h.statsService.GetMutualAidReport(communityID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}
