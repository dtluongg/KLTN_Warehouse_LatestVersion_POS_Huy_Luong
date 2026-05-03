package IUH.KLTN.LvsH.service;

public interface LoginRateLimitService {
    void assertAllowed(String key);
    void recordFailure(String key);
    void reset(String key);
}