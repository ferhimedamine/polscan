#!/bin/bash

# group: Puppet-Run
# name: No failed
# description: Checks for Puppet 2/3/4 last_run_report.yaml for failed resources

if puppet_enabled; then
	if [ "$(find "$(dirname $puppet_report)" -name "$(basename $puppet_report)" -mtime +1)" != "" ]; then
		result_failed "No run in the last 24 hours!"
	else
	    failed=$(nl $puppet_report 2>/dev/null | grep 'status: failure')
	    resources=
	    while read f; do
		    # Ugly YAML parsing by backtracking resource...
		    resources="$resources,$(nl $puppet_report | grep -B100 "$f" | grep 'resource:' | sed 's/.*resource://;s/"//g' | tail -1)"
	    done < <(/bin/echo "$failed" | grep -v "^$")

	    if [ "$resources" != "" ]; then
		    result_failed "Failed resources:" ${resources/,/}
	    else
		    result_ok
		fi
	fi
fi
