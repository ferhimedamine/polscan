#!/bin/bash

# group: Network
# name: Inventory
# description: Inventory only scanner determining webserver upstreams (nginx server definitions, Apache proxy passes). Relies on nginx upstream definitions to be found in /etc/nginx/conf.d/* and Apache BalancerMember directives found in {/etc/apache2,/usr/local/apache2/conf}/sites-enabled.

if [ -d /etc/nginx/conf.d ]; then
	rgrep -h "^[[:space:]]*server[[:space:]][^{]" /etc/nginx/conf.d |\
	sed 's/^[[:space:]]*//;s/[\:;]/ /g' |\
	while read server name port rest; do
		result_network_edge "Webserver Upstream" "nginx" "$(hostname -f)" "upstream" "$name" "$port" "out" 1
	done
fi

for d in /etc/apache2/sites-enabled /usr/local/apache2/conf/sites-enabled; do
	if [ -d "$d" ]; then
		grep -h "^[[:space:]]*BalancerMember.*://" "$d"/* 2>/dev/null
	fi
done | sed "s/.*:\/\///;s/[[:space:]].*//;s/:/ /g" | sort -u |\
while read name port rest; do
	result_network_edge "Webserver Upstream" "Apache" "$(hostname -f)" "upstream" "$name" "$port" "out" 1
done


