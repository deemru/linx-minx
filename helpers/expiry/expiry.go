package expiry

import (
	"time"
)

func IsTsExpired(expiryTimestamp int64) bool {
	if expiryTimestamp == 0 {
		return false
	}

	expiry := time.Unix(expiryTimestamp, 0)
	return time.Now().After(expiry)
}
