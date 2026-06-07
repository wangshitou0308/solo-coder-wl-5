package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"size:50;not null;unique" json:"username"`
	Email        string    `gorm:"size:100;not null;unique" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Phone        string    `gorm:"size:20" json:"phone"`
	Avatar       string    `gorm:"size:255" json:"avatar"`
	CreditScore  int       `gorm:"default:100" json:"credit_score"`
	IsAdmin      bool      `gorm:"default:false" json:"is_admin"`
	CreatedAt    time.Time `json:"created_at"`
}

type Community struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Location    string    `gorm:"size:255" json:"location"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	AdminID     uint      `json:"admin_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type CommunityMember struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CommunityID uint      `gorm:"not null;index" json:"community_id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	Role        string    `gorm:"size:20;default:'member'" json:"role"`
	JoinedAt    time.Time `json:"joined_at"`
}

type Supply struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OwnerID     uint      `gorm:"not null;index" json:"owner_id"`
	CommunityID uint      `gorm:"not null;index" json:"community_id"`
	Category    string    `gorm:"size:50;not null" json:"category"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Quantity    int       `gorm:"not null" json:"quantity"`
	Unit        string    `gorm:"size:20" json:"unit"`
	ExpireDate  *time.Time `json:"expire_date"`
	PhotoURL    string    `gorm:"size:255" json:"photo_url"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	Status      string    `gorm:"size:20;default:'available'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type BorrowRequest struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	RequesterID uint     `gorm:"not null;index" json:"requester_id"`
	SupplyID   uint      `gorm:"not null;index" json:"supply_id"`
	Quantity   int       `gorm:"not null" json:"quantity"`
	Purpose    string    `gorm:"type:text" json:"purpose"`
	Priority   string    `gorm:"size:20;default:'normal'" json:"priority"`
	Status     string    `gorm:"size:20;default:'pending'" json:"status"`
	PickupCode string    `gorm:"size:20" json:"pickup_code"`
	CreatedAt  time.Time `json:"created_at"`
}

type BorrowRecord struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	RequestID     uint       `gorm:"not null;index" json:"request_id"`
	BorrowerID    uint       `gorm:"not null;index" json:"borrower_id"`
	OwnerID       uint       `gorm:"not null;index" json:"owner_id"`
	SupplyID      uint       `gorm:"not null;index" json:"supply_id"`
	Quantity      int        `gorm:"not null" json:"quantity"`
	BorrowedAt    time.Time  `json:"borrowed_at"`
	DueDate       time.Time  `json:"due_date"`
	ReturnedAt    *time.Time `json:"returned_at"`
	Status        string     `gorm:"size:20;default:'borrowing'" json:"status"`
	LenderRating  *int       `json:"lender_rating"`
	BorrowerRating *int      `json:"borrower_rating"`
}

type Alert struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	Title        string     `gorm:"size:200;not null" json:"title"`
	Type         string     `gorm:"size:20;not null" json:"type"`
	Level        string     `gorm:"size:20" json:"level"`
	Description  string     `gorm:"type:text" json:"description"`
	AffectedArea string     `gorm:"size:255" json:"affected_area"`
	Status       string     `gorm:"size:20;default:'warning'" json:"status"`
	CreatorID    uint       `json:"creator_id"`
	CreatedAt    time.Time  `json:"created_at"`
	ResolvedAt   *time.Time `json:"resolved_at"`
}

type AlertSupply struct {
	ID               uint   `gorm:"primaryKey" json:"id"`
	AlertID          uint   `gorm:"not null;index" json:"alert_id"`
	Category         string `gorm:"size:50;not null" json:"category"`
	RequiredQuantity int    `gorm:"not null" json:"required_quantity"`
	FulfilledQuantity int   `gorm:"default:0" json:"fulfilled_quantity"`
	Priority         string `gorm:"size:20" json:"priority"`
}
