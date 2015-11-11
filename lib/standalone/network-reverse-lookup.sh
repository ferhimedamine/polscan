# group: Network
# name: Host Reverse Lookup
# description: Ensures that all hosts have reverse lookup properly configured

for h in $HOST_LIST; do
	ip=$(dig +short $h)
	if [ "$ip" != "" ]; then
		reverse=$(dig +short -x $ip)
		if ! echo "${reverse}" | grep -q "^${h}\."; then
			echo "$h FAILED Reverse lookup failed. Unexpected result '$reverse'."
		else
			echo "$h OK"
		fi
	fi
done
