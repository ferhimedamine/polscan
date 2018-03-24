#!/bin/bash

# group: Puppet
# name: /etc/security/limits* managed
# description: Checks for Puppet 2/3/4 wether all /etc/security/limits.d/* definitions are managed using drop files

if puppet_enabled; then
	if puppet_run_ok; then
		files=$(ls /etc/security/limits.d/* 2>/dev/null)
		unmanaged=
		for f in $files; do
			if ! puppet_resource_exists "File" "$f"; then
				unmanaged="${unmanaged} $f"
			fi
		done
	
		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged files found:$unmanaged"
		else
			result_ok
		fi
	fi

	tmp=$(egrep -v "^#|^[[:space:]]*$" /etc/security/limits.conf | paste -d'#' -s)
	if [ "$tmp" != "" ]; then
		result_failed "Unexpected entries in /etc/security/limits.conf (all entries should be Puppet managed and in separate files in /etc/security/limits.d/):#$tmp"
	fi
fi
