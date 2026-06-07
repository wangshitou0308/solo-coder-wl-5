package services

import (
	"community-reservelink/internal/config"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

type RedisService struct {
	client *redis.Client
}

func InitRedis(cfg *config.Config) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr: cfg.GetRedisAddr(),
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("redis 连接失败: %w", err)
	}

	return nil
}

func NewRedisService() *RedisService {
	return &RedisService{
		client: RedisClient,
	}
}

func (r *RedisService) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, key, data, expiration).Err()
}

func (r *RedisService) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

func (r *RedisService) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

func (r *RedisService) Exists(ctx context.Context, key string) (bool, error) {
	result, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

func (r *RedisService) ZAddHotSupply(ctx context.Context, supplyID string, score float64) error {
	return r.client.ZIncrBy(ctx, "hot_supplies", score, supplyID).Err()
}

func (r *RedisService) ZGetHotSupplies(ctx context.Context, count int64) ([]string, error) {
	result, err := r.client.ZRevRange(ctx, "hot_supplies", 0, count-1).Result()
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *RedisService) SetSession(ctx context.Context, userID string, token string, expiration time.Duration) error {
	key := fmt.Sprintf("session:%s", userID)
	return r.client.Set(ctx, key, token, expiration).Err()
}

func (r *RedisService) GetSession(ctx context.Context, userID string) (string, error) {
	key := fmt.Sprintf("session:%s", userID)
	return r.client.Get(ctx, key).Result()
}

func (r *RedisService) DeleteSession(ctx context.Context, userID string) error {
	key := fmt.Sprintf("session:%s", userID)
	return r.client.Del(ctx, key).Err()
}

func (r *RedisService) IncrViewCount(ctx context.Context, supplyID string) error {
	key := fmt.Sprintf("supply:view:%s", supplyID)
	return r.client.Incr(ctx, key).Err()
}

func (r *RedisService) GetViewCount(ctx context.Context, supplyID string) (int64, error) {
	key := fmt.Sprintf("supply:view:%s", supplyID)
	return r.client.Get(ctx, key).Int64()
}
