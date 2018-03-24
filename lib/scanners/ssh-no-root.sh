#!/bin/bash

# group: SSH
# name: PermitRootLogin no
# description: Checks /etc/ssh/sshd_config for PermitRootLogin no
# solution-cmd: sed -i 's/PermitRootLogin.*yes/PermitRootLogin no/' /etc/ssh/sshd_config

if grep -q "PermitRootLogin no" /etc/ssh/sshd_config 2>/dev/null; then
	result_ok
else
	result_failed
fi
