local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local data = redis.call("HMGET", key, "tokens", "timestamp")

local tokens = tonumber(data[1]) or capacity
local last = tonumber(data[2]) or now

local delta = math.max(0, now - last)
local refill = delta * refill_rate

tokens = math.min(capacity, tokens + refill)

if tokens < 1 then
  return {0, tokens}
end

tokens = tokens - 1

redis.call("HMSET", key, "tokens", tokens, "timestamp", now)
redis.call("EXPIRE", key, ttl)

return {1, tokens}