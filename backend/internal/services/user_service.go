package services

import (
	"community-reservelink/internal/config"
	"community-reservelink/internal/models"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService() *UserService {
	return &UserService{
		db: config.GetDB(),
	}
}

type RegisterRequest struct {
	Username  string  `json:"username" binding:"required"`
	Email     string  `json:"email" binding:"required,email"`
	Password  string  `json:"password" binding:"required,min=6"`
	Phone     string  `json:"phone"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

type UpdateUserRequest struct {
	Username  string   `json:"username"`
	Phone     string   `json:"phone"`
	Avatar    string   `json:"avatar"`
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
	Address   string   `json:"address"`
}

func (s *UserService) Register(req *RegisterRequest) (*models.User, error) {
	var existingUser models.User
	result := s.db.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser)
	if result.Error == nil {
		return nil, errors.New("邮箱或用户名已存在")
	}
	if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, result.Error
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Phone:        req.Phone,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		Address:      req.Address,
		CreditScore:  100,
		IsVerified:   false,
	}

	result = s.db.Create(user)
	if result.Error != nil {
		return nil, result.Error
	}

	return user, nil
}

func (s *UserService) Login(req *LoginRequest) (*LoginResponse, error) {
	var user models.User
	result := s.db.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("邮箱或密码错误")
		}
		return nil, result.Error
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("邮箱或密码错误")
	}

	token, err := s.generateToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	s.db.Model(&user).Update("last_login_at", time.Now())

	return &LoginResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *UserService) GetByID(userID uuid.UUID) (*models.User, error) {
	var user models.User
	result := s.db.First(&user, "id = ?", userID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, result.Error
	}
	return &user, nil
}

func (s *UserService) Update(userID uuid.UUID, req *UpdateUserRequest) (*models.User, error) {
	user, err := s.GetByID(userID)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}
	if req.Latitude != nil {
		updates["latitude"] = *req.Latitude
	}
	if req.Longitude != nil {
		updates["longitude"] = *req.Longitude
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}

	result := s.db.Model(user).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}

	return user, nil
}

func (s *UserService) UpdateCreditScore(userID uuid.UUID, delta int) error {
	user, err := s.GetByID(userID)
	if err != nil {
		return err
	}

	newScore := user.CreditScore + delta
	if newScore < 0 {
		newScore = 0
	}
	if newScore > 100 {
		newScore = 100
	}

	result := s.db.Model(user).Update("credit_score", newScore)
	return result.Error
}

func (s *UserService) generateToken(userID uuid.UUID, username string) (string, error) {
	cfg := config.Load()
	claims := &jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}
