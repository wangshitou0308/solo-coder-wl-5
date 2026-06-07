package main

import (
	"community-reservelink/internal/config"
	"community-reservelink/internal/handlers"
	"community-reservelink/internal/middleware"
	"community-reservelink/internal/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	err = services.InitRedis(cfg)
	if err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authHandler := handlers.NewAuthHandler()
	userHandler := handlers.NewUserHandler()
	communityHandler := handlers.NewCommunityHandler()
	supplyHandler := handlers.NewSupplyHandler()
	borrowHandler := handlers.NewBorrowHandler()
	alertHandler := handlers.NewAlertHandler()
	statsHandler := handlers.NewStatsHandler()

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.JWTAuth(), authHandler.Me)
		}

		users := api.Group("/users")
		users.Use(middleware.JWTAuth())
		{
			users.GET("/:id", userHandler.GetByID)
			users.PUT("/", userHandler.Update)
			users.PUT("/:id/credit-score", userHandler.UpdateCreditScore)
		}

		communities := api.Group("/communities")
		{
			communities.GET("/search", communityHandler.Search)
			communities.GET("/:id", communityHandler.GetByID)
			communities.GET("/:id/members", communityHandler.GetMembers)

			communities.Use(middleware.JWTAuth())
			{
				communities.POST("/", communityHandler.Create)
				communities.PUT("/:id", communityHandler.Update)
				communities.DELETE("/:id", communityHandler.Delete)
				communities.POST("/:id/join", communityHandler.Join)
				communities.POST("/:id/leave", communityHandler.Leave)
				communities.GET("/mine/list", communityHandler.GetMyCommunities)
			}
		}

		supplies := api.Group("/supplies")
		{
			supplies.GET("/search", supplyHandler.Search)
			supplies.GET("/hot", supplyHandler.GetHotSupplies)
			supplies.GET("/categories", supplyHandler.GetCategories)
			supplies.GET("/:id", supplyHandler.GetByID)
			supplies.GET("/user/:user_id", supplyHandler.GetByUser)

			supplies.Use(middleware.JWTAuth())
			{
				supplies.POST("/", supplyHandler.Create)
				supplies.PUT("/:id", supplyHandler.Update)
				supplies.DELETE("/:id", supplyHandler.Delete)
				supplies.GET("/mine/list", supplyHandler.GetMySupplies)
			}
		}

		borrows := api.Group("/borrows")
		borrows.Use(middleware.JWTAuth())
		{
			borrows.POST("/", borrowHandler.Create)
			borrows.GET("/:id", borrowHandler.GetByID)
			borrows.PUT("/:id/approve", borrowHandler.Approve)
			borrows.PUT("/:id/pickup", borrowHandler.Pickup)
			borrows.PUT("/:id/return", borrowHandler.Return)
			borrows.PUT("/:id/rate", borrowHandler.Rate)
			borrows.GET("/mine/borrows", borrowHandler.GetMyBorrows)
			borrows.GET("/mine/lends", borrowHandler.GetMyLends)
			borrows.POST("/check-overdue", borrowHandler.CheckOverdue)
		}

		alerts := api.Group("/alerts")
		{
			alerts.GET("/", alertHandler.List)
			alerts.GET("/:id", alertHandler.GetByID)
			alerts.GET("/:id/supplies", alertHandler.GetSupplies)
			alerts.GET("/:id/match-gap", alertHandler.MatchGap)

			alerts.Use(middleware.JWTAuth())
			{
				alerts.POST("/", alertHandler.Create)
				alerts.PUT("/:id", alertHandler.Update)
				alerts.DELETE("/:id", alertHandler.Delete)
				alerts.POST("/:id/supplies", alertHandler.AddSupplies)
			}
		}

		stats := api.Group("/stats")
		{
			stats.GET("/dashboard", statsHandler.GetDashboard)
			stats.GET("/contribution-rank", statsHandler.GetContributionRank)
			stats.GET("/mutual-aid-report", statsHandler.GetMutualAidReport)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now(),
		})
	})

	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
