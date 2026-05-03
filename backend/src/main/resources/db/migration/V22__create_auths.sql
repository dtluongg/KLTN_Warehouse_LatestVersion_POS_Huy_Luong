-- V22: Lưu refresh token dạng hash để hỗ trợ revoke/rotate an toàn

CREATE TABLE IF NOT EXISTS auths (
    id UUID PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES staff(id),
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auths_staff_id ON auths(staff_id);
CREATE INDEX idx_auths_expires_at ON auths(expires_at);
CREATE INDEX idx_auths_revoked_at ON auths(revoked_at);