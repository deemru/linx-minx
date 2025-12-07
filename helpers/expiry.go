package helpers

import (
	"fmt"
	"time"
)

type ExpirationTime struct {
	Seconds uint64
	Human   string
}

func ListExpirationTimes(maxExpiry uint64) []ExpirationTime {
	var expiryList []ExpirationTime

	defaultOptions := []struct {
		seconds uint64
		label   string
	}{
		{86400, "Day"},
		{86400 * 30, "Month"},
		{86400 * 365, "Year"},
	}

	for _, opt := range defaultOptions {
		if maxExpiry == 0 || opt.seconds <= maxExpiry {
			expiryList = append(expiryList, ExpirationTime{
				Seconds: opt.seconds,
				Human:   opt.label,
			})
		}
	}

	if maxExpiry == 0 {
		expiryList = append(expiryList, ExpirationTime{
			Seconds: 0,
			Human:   "Forever",
		})
	} else {
		hasMaxExpiry := false
		for _, opt := range expiryList {
			if opt.Seconds == maxExpiry {
				hasMaxExpiry = true
				break
			}
		}
		if !hasMaxExpiry {
			now := time.Now()
			expiryTime := now.Add(time.Duration(maxExpiry) * time.Second)
			expiryList = append(expiryList, ExpirationTime{
				Seconds: maxExpiry,
				Human:   FormatRelTime(now, expiryTime),
			})
		}
	}

	return expiryList
}

func FormatRelTime(now, then time.Time) string {
	diff := then.Sub(now)

	if diff < time.Hour {
		minutes := int(diff.Minutes())
		if minutes == 1 {
			return "1 minute"
		}
		return formatPlural(minutes, "minute")
	}

	if diff < 24*time.Hour {
		hours := int(diff.Hours())
		if hours == 1 {
			return "1 hour"
		}
		return formatPlural(hours, "hour")
	}

	if diff < 365*24*time.Hour {
		days := int(diff.Hours() / 24)
		if days == 1 {
			return "1 day"
		}
		return formatPlural(days, "day")
	}

	years := int(diff.Hours() / (365 * 24))
	if years == 1 {
		return "1 year"
	}
	return formatPlural(years, "year")
}

func formatPlural(n int, unit string) string {
	return fmt.Sprintf("%d %ss", n, unit)
}
