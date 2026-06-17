package clash

import (
	"strings"
	"testing"

	"github.com/grootpxw/edgetunnel-bestsub-v2/internal/config"
	"github.com/grootpxw/edgetunnel-bestsub-v2/internal/probe"
	"gopkg.in/yaml.v3"
)

func TestBuildUsesProxiedDNSForRegularLookups(t *testing.T) {
	body, err := Build(config.Config{
		Clash: config.ClashConfig{
			Host:        "worker.example.com",
			UUID:        "00000000-0000-0000-0000-000000000000",
			NodeType:    "vless",
			Network:     "ws",
			Fingerprint: "chrome",
			TestURL:     "http://www.gstatic.com/generate_204",
			Interval:    300,
			ECH:         true,
			ECHSNI:      "cloudflare-ech.com",
		},
	}, []probe.Result{{
		Success: true,
		IP:      "104.16.1.1",
		Port:    443,
	}})
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}

	var doc map[string]any
	if err := yaml.Unmarshal([]byte(body), &doc); err != nil {
		t.Fatalf("unmarshal generated yaml: %v", err)
	}

	dns, ok := doc["dns"].(map[string]any)
	if !ok {
		t.Fatalf("dns block missing or wrong type: %#v", doc["dns"])
	}
	tun, ok := doc["tun"].(map[string]any)
	if !ok {
		t.Fatalf("tun block missing or wrong type: %#v", doc["tun"])
	}

	assertString(t, dns, "enhanced-mode", "fake-ip")
	assertString(t, dns, "fake-ip-range", "198.18.0.1/16")
	assertString(t, dns, "listen", "0.0.0.0:1053")
	assertBool(t, dns, "ipv6", false)
	assertBool(t, tun, "enable", true)
	assertBool(t, tun, "strict-route", true)
	assertContains(t, toStrings(t, tun["dns-hijack"]), "any:53")
	assertContains(t, toStrings(t, tun["dns-hijack"]), "tcp://any:53")

	nameservers := toStrings(t, dns["nameserver"])
	if len(nameservers) != 2 {
		t.Fatalf("nameserver length = %d, want 2: %#v", len(nameservers), nameservers)
	}
	for _, ns := range nameservers {
		if !strings.HasSuffix(ns, "#"+autoSelectGroup) {
			t.Fatalf("nameserver %q is not bound to %q", ns, autoSelectGroup)
		}
		if strings.Contains(ns, "alidns") || strings.Contains(ns, "doh.pub") {
			t.Fatalf("regular nameserver should not use domestic DNS: %q", ns)
		}
	}

	policy, ok := dns["nameserver-policy"].(map[string]any)
	if !ok {
		t.Fatalf("nameserver-policy missing or wrong type: %#v", dns["nameserver-policy"])
	}
	assertContains(t, toStrings(t, policy["worker.example.com"]), "https://dns.alidns.com/dns-query")
	assertContains(t, toStrings(t, policy["cloudflare-ech.com"]), "https://doh.pub/dns-query")
}

func assertString(t *testing.T, m map[string]any, key, want string) {
	t.Helper()
	if got, ok := m[key].(string); !ok || got != want {
		t.Fatalf("%s = %#v, want %q", key, m[key], want)
	}
}

func assertBool(t *testing.T, m map[string]any, key string, want bool) {
	t.Helper()
	if got, ok := m[key].(bool); !ok || got != want {
		t.Fatalf("%s = %#v, want %v", key, m[key], want)
	}
}

func assertContains(t *testing.T, got []string, want string) {
	t.Helper()
	for _, item := range got {
		if item == want {
			return
		}
	}
	t.Fatalf("%#v does not contain %q", got, want)
}

func toStrings(t *testing.T, v any) []string {
	t.Helper()
	raw, ok := v.([]any)
	if !ok {
		t.Fatalf("value is not a list: %#v", v)
	}
	out := make([]string, 0, len(raw))
	for _, item := range raw {
		s, ok := item.(string)
		if !ok {
			t.Fatalf("list item is not a string: %#v", item)
		}
		out = append(out, s)
	}
	return out
}
