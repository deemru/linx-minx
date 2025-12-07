package helpers

import (
	"net/http"
	"net/url"
)

func GetSiteURL(r *http.Request) string {
	u := &url.URL{}
	u.Host = r.Host

	if scheme := r.Header.Get("X-Forwarded-Proto"); scheme != "" {
		u.Scheme = scheme
	} else {
		u.Scheme = "http"
	}

	return u.String()
}
