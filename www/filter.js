// vim: set ts=4 sw=4:

var reverseHostgroups = undefined;	// reverse hash of the hostGroups hash

function getGroupByHost(groupType, host) {
	if(undefined === reverseHostgroups) {
		// initialize reverse lookup hash
		reverseHostgroups = {};
		for(name in hostGroups) {
			$.each(hostGroups[name], function(i, h) {
				if(undefined === reverseHostgroups[h])
					reverseHostgroups[h] = {};

				reverseHostgroups[h][name] = 1;
			});
		}
	}

	if(!groupType in hostGroupNamespaces ||
	   undefined === reverseHostgroups[host])
		return 'Ungrouped';

	for(name in reverseHostgroups[host]) {
		if(name.indexOf(groupType) == 0)
			return name.split(/::/)[1];
	}
	return 'Ungrouped';
}

function get_hosts_filtered(params, searchNames) {
	var hg = undefined;
	var results = new Array();

	if(params.fT && params.fT !== "" && params.fV && params.fV !== "")
		hg = params.fT + "::" + params.fV;

	for(host in hosts) {
		if(searchNames && params.sT && params.sT !== "" && host.indexOf(params.sT) == -1)
			continue;

		if(undefined === hg || params.fV == getGroupByHost(params.fT, host))
			results.push(host);
	}
	return results;
}

// Add all host group types to a <select>
function loadHostGroupTypes(data, id, groupType, noneAllowed) {
	var options = [];
	hostGroups = data;
	$.each(data, function(name, list) {
		var ns = name.split(/::/)[0];
		if(ns in hostGroupNamespaces)
			hostGroupNamespaces[ns]++;
		else
			hostGroupNamespaces[ns]=1;
	});

	if (noneAllowed)
		options.push('<option value=""></option>');
	for(hg in hostGroupNamespaces) {
		options.push('<option value="'+hg+'">'+hg+'</option>');
	}
	$('#'+id).append(options.sort().join(''));
	$('#'+id+" option[value='"+(groupType !== undefined?groupType:'')+"']").attr('selected', true);
}

// Add all host group values to a <select>
var hgValues;
function loadHostGroupValues(data, id, group, value, noneAllowed) {
	var options = [];
	hgValues = new Array();
	$.each(data, function(name, list) {
		if(group == name.split(/::/)[0]) {
			var v = name.split(/::/)[1];
			hgValues.push(v);
		}
	});

	$('#'+id).children().remove();
	if (noneAllowed)
		options.push('<option value=""></option>');
	hgValues = hgValues.sort();
	for(var i = 0; i < hgValues.length; i++) {
		options.push('<option value="'+hgValues[i]+'">'+hgValues[i]+'</option>');
	}
	$('#'+id).append(options.sort().join(''));
	$('#'+id+" option[value='"+(value !== undefined?value:'')+"']").attr('selected', true);
}

function addCalendar(id, initialDate) {
	$(id).datepicker({
		dateFormat: "yy/mm/dd",
		firstDay: 1,
		defaultDate: new Date(initialDate),
		onSelect: function(date) { applyFilterSettings(date); }
	});
	getData('host_groups', function(data) {
		var yearMonth = data.date.substring(0, data.date.length - 2);
		getDataUrl('results/json/'+yearMonth, 'calendar', function(data) {
			for(i = 1; i <= 31; i++) {
				var td = $(id + ' td').filter(function() {
					return $(this).text() == ""+i; 
				});
				if(-1 !== data.days.indexOf(i))
					td.addClass('available');
				else
					td.addClass('unavailable');
			}
		}, function(j, t, e) {
			// nothing to do if calendar is not there
		});
	});
}

function applyFilterSettings(date) {
	var o = view.current.filterOptions;
	var params = {};
	if(!o)
		o = {};
	if(!date) {
		params.d = $('#datepicker').val()
	} else {
		params.d = date;
	}

	if(o.inventory)
		params.iT = $('#inventoryType').val();
	if(o.findings)
		params.fG = $('#findingsGroup').val();
	if(o.groupbyid)
		params.gI = $('#groupById').val();
	if(o.groupbyhg)
		params.gT = $('#hostmapGroupType').val();
	if(o.filterby) {
		params.fT = $('#hostmapFilterType').val();
		params.fV = $('#hostmapFilterValue').val();
	}
	if(o.search)
		params.sT = $('#search').val();
	if(o.host)
		params.h = $('#selectedHost').val();
	if(o.nt)
		params.nt = $('#netedgeType').val();

	setLocationHash(params, true);
}

function loadFilterSettings(params, o) {
	var fbox = $('#filter');

	if(o === undefined) {
		fbox.hide();
		return;
	}
	fbox.show();

	fbox.html("<span class='label datepicker'>Date</span> <input type='text' id='datepicker' size='10'/> "+
			"<span id='calendar'></span>");

	if(o.filterby)
		fbox.append('<span class="label">Filter by</span> <select id="hostmapFilterType"></select><select id="hostmapFilterValue"/></select> ');

	if(o.search) {
		fbox.append('<span class="label">Search</span> <input type="text" width="100%" id="search"/> ')
			$("#search").val(params.sT);
	}
	if(o.host) {
		fbox.append('Host <input type="text" value="'+(params.h !== undefined?params.h:'')+'" list="availableHosts" id="selectedHost"/>' +	
				' <datalist id="availableHosts"/>');
		getData("hosts", function(data) {
			$.each(data.results, function(host) {
				$('#availableHosts').append('<option value="'+host+'">');
			});
		});
	}

	fbox.append('<input class="filterGo" type="button" value="Apply"/> ');

	if(o.copyHosts)
		fbox.append('<input type="button" value="Host List" title="Get list of problem hosts" onclick="view.onCopyHosts()"/><div id="hostlist"/>');

	$("#filter *").attr('disabled', true);
	$("#datepicker").datepicker({
		dateFormat: "yy/mm/dd"
	});
	getData('host_groups', function(data) {
		try {
			if(o.filterby) {
				loadHostGroupTypes(resultCache['host_groups'].results, 'hostmapFilterType', params.fT, true);
				loadHostGroupValues(resultCache['host_groups'].results, 'hostmapFilterValue', params.fT, params.fV, true);
			}
		} catch(e) {
			error("Loading some host group definitions failed!");
		}
		$('#hostmapFilterType').change(function() {
			loadHostGroupValues(resultCache['host_groups'].results, 'hostmapFilterValue', $('#hostmapFilterType').val(), undefined, true);
		});

		$("#datepicker").val(data.date);
		$("#calendar").datepicker("setDate", data.date);
		$("#filter *").removeAttr('disabled');
	});

	$('.filterGo').click(function() {
		applyFilterSettings();
	});
}
