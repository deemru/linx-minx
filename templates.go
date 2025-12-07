package main

import (
	"embed"
	"fmt"
	"html/template"
	"io"
	"net/http"
)

//go:embed templates
var templatesFS embed.FS

var templates map[string]*template.Template

var pageTemplates = []struct {
	path     string
	basePath string
	pagePath string
}{
	{"templates/index.html", "templates/linx-minx.html", "templates/index.html"},
	{"templates/display/file.html", "templates/linx-minx.html", "templates/display/file.html"},
	{"templates/403.html", "templates/linx-minx.html", "templates/403.html"},
	{"templates/404.html", "templates/linx-minx.html", "templates/404.html"},
}

func init() {
	templates = make(map[string]*template.Template)

	for _, page := range pageTemplates {
		tplSet := template.New(page.path)

		baseBytes, err := templatesFS.ReadFile(page.basePath)
		if err != nil {
			panic("Failed to load base template " + page.basePath + ": " + err.Error())
		}

		_, err = tplSet.Parse(string(baseBytes))
		if err != nil {
			panic("Failed to parse base template " + page.basePath + ": " + err.Error())
		}

		pageBytes, err := templatesFS.ReadFile(page.pagePath)
		if err != nil {
			panic("Failed to load page template " + page.pagePath + ": " + err.Error())
		}

		_, err = tplSet.Parse(string(pageBytes))
		if err != nil {
			panic("Failed to parse page template " + page.pagePath + ": " + err.Error())
		}

		templates[page.path] = tplSet
	}
}

func getSitePath() string {
	if Config.sitePath == "" || Config.sitePath == "/" {
		return "/"
	}

	path := Config.sitePath
	if path[0] != '/' {
		path = "/" + path
	}
	if path[len(path)-1] != '/' {
		path = path + "/"
	}
	return path
}

func renderTemplate(tplPath string, context map[string]interface{}, _ *http.Request, w io.Writer) error {
	if context == nil {
		context = make(map[string]interface{})
	}
	context["sitepath"] = getSitePath()
	context["siteName"] = Config.siteName

	tplSet, ok := templates[tplPath]
	if !ok {
		tplSet, ok = templates["templates/404.html"]
		if !ok {
			return fmt.Errorf("template not found: %s", tplPath)
		}
	}

	tpl := tplSet.Lookup(tplPath)
	if tpl == nil {
		return fmt.Errorf("template definition not found in set: %s", tplPath)
	}

	return tpl.Execute(w, context)
}
