// Initialize the map
const map = L.map('map').setView([54.2361, -4.5481], 6);

// Add a base map layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Load the CSV file
fetch('csv/chargers.csv')
    .then(response => response.text())
    .then(csvData => {
        // Parse the CSV data
        const data = Papa.parse(csvData, { header: true, skipEmptyLines: true });

        // Create an array of marker objects with popups
        const markers = data.data.map(row => {
            const marker = L.marker([row.latitude, row.longitude]);
            marker.bindPopup(`
                            Controller: ${row.deviceControllerName}<br>
                            Charge Status: (${row.chargeDeviceStatus})<br>
                            Connector1 Type: (${row.connector1Type})<br>
                            Connector1 OutputKW: (${row.connector1RatedOutputKW})<br>
                            Connector2 Type: (${row.connector2Type})<br>
                            Connector2 OutputKW: (${row.connector2RatedOutputKW})<br>
                            `);
            marker.deviceControllerName = row.deviceControllerName;
            marker.connector1RatedOutputKW = row.connector1RatedOutputKW;
            marker.chargeDeviceStatus = row.chargeDeviceStatus;
            marker.subscriptionRequired = row.subscriptionRequired;
            marker.paymentRequired = row.paymentRequired;
            return marker;
        });

        // Create a marker cluster group
        const markerCluster = L.markerClusterGroup();
        map.addLayer(markerCluster);

        // Function to update the map based on the selected options
        const updateMap = () => {
            const selectedControllers = Array.from(document.querySelectorAll('#device-controller-filter option:checked')).map(cb => cb.value);
            const selectedOutputKW = Array.from(document.querySelectorAll('#output-kw-filter option:checked')).map(cb => cb.value);
            const selectedChargeDeviceStatus = Array.from(document.querySelectorAll('#charge-device-status-filter option:checked')).map(cb => cb.value);
            const selectedSubscriptionRequired = Array.from(document.querySelectorAll('#subscription-required-filter option:checked')).map(cb => cb.value);
            const selectedPaymentRequired = Array.from(document.querySelectorAll('#payment-required-filter option:checked')).map(cb => cb.value);

            const filteredMarkers = markers.filter(marker => 
                (selectedControllers.includes(marker.deviceControllerName) || selectedControllers.includes('All')) &&
                (selectedOutputKW.includes(marker.connector1RatedOutputKW) || selectedOutputKW.includes('All')) &&
                (selectedChargeDeviceStatus.includes(marker.chargeDeviceStatus) || selectedChargeDeviceStatus.includes('All')) &&
                (selectedSubscriptionRequired.includes(marker.subscriptionRequired) || selectedSubscriptionRequired.includes('All')) &&
                (selectedPaymentRequired.includes(marker.paymentRequired) || selectedPaymentRequired.includes('All'))
            );

            markerCluster.clearLayers();
            markerCluster.addLayers(filteredMarkers);
        };

        const createDropdown = (id, labelText, options) => {
            const div = document.createElement('div');
            const label = document.createElement('label');
            label.htmlFor = id;
            label.textContent = labelText;
            div.appendChild(label);

            const select = document.createElement('select');
            select.id = id;
            select.addEventListener('change', updateMap);
            div.appendChild(select);

            const selectAllOption = document.createElement('option');
            selectAllOption.value = 'All';
            selectAllOption.text = 'Select All';
            select.appendChild(selectAllOption);

            options.forEach(optionValue => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.text = optionValue;
                select.appendChild(option);
            });

            return div;
        };

        const filtersDiv = document.getElementById('filters');
        const uniqueControllers = Array.from(new Set(markers.map(marker => marker.deviceControllerName))).sort();
        const uniqueOutputKW = Array.from(new Set(markers.map(marker => marker.connector1RatedOutputKW))).sort((a, b) => a - b);
        const uniqueChargeDeviceStatus = Array.from(new Set(markers.map(marker => marker.chargeDeviceStatus))).sort();
        const uniqueSubscriptionRequired = Array.from(new Set(markers.map(marker => marker.subscriptionRequired))).sort();
        const uniquePaymentRequired = Array.from(new Set(markers.map(marker => marker.paymentRequired))).sort();

        filtersDiv.appendChild(createDropdown('device-controller-filter', 'Controller: ', uniqueControllers));
        filtersDiv.appendChild(createDropdown('output-kw-filter', 'Output KW: ', uniqueOutputKW));
        filtersDiv.appendChild(createDropdown('charge-device-status-filter', 'Charge Device Status: ', uniqueChargeDeviceStatus));
        filtersDiv.appendChild(createDropdown('subscription-required-filter', 'Subscription Required: ', uniqueSubscriptionRequired));
        filtersDiv.appendChild(createDropdown('payment-required-filter', 'Payment Required: ', uniquePaymentRequired));

        // Initialize the map with all markers
        updateMap();

        function drawCircle(lat, lng, radius) {
            const circle = L.circle([lat, lng], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: radius * 1000 // Convert km to meters
            }).addTo(map);
            return circle;
        }

        let circle;
        map.on('click', function (e) {
            if (circle) {
                map.removeLayer(circle);
            }
            const radius = parseFloat(prompt("Enter the radius in kilometers:"));
            if (!isNaN(radius) && radius > 0) {
                circle = drawCircle(e.latlng.lat, e.latlng.lng, radius);
        
                const selectedControllers = Array.from(document.querySelectorAll('#device-controller-filter option:checked')).map(cb => cb.value);
                const selectedOutputKW = Array.from(document.querySelectorAll('#output-kw-filter option:checked')).map(cb => cb.value);
                const selectedChargeDeviceStatus = Array.from(document.querySelectorAll('#charge-device-status-filter option:checked')).map(cb => cb.value);
                const selectedSubscriptionRequired = Array.from(document.querySelectorAll('#subscription-required-filter option:checked')).map(cb => cb.value);
                const selectedPaymentRequired = Array.from(document.querySelectorAll('#payment-required-filter option:checked')).map(cb => cb.value);
        
                const filteredMarkers = markers.filter(marker => 
                    (selectedControllers.includes(marker.deviceControllerName) || selectedControllers.includes('All')) &&
                    (selectedOutputKW.includes(marker.connector1RatedOutputKW) || selectedOutputKW.includes('All')) &&
                    (selectedChargeDeviceStatus.includes(marker.chargeDeviceStatus) || selectedChargeDeviceStatus.includes('All')) &&
                    (selectedSubscriptionRequired.includes(marker.subscriptionRequired) || selectedSubscriptionRequired.includes('All')) &&
                    (selectedPaymentRequired.includes(marker.paymentRequired) || selectedPaymentRequired.includes('All'))
                );
        
                let count = 0;
                filteredMarkers.forEach(marker => {
                    if (isMarkerInsideCircle(marker, circle)) {
                        count++;
                    }
                });
        
                alert(`There are ${count} chargers within ${radius} kilometers of the selected point based on the selected filters.`);
            }
        });
        

        function isMarkerInsideCircle(marker, circle) {
            const circleBounds = circle.getBounds();
            const distance = circle.getLatLng().distanceTo(marker.getLatLng());
            return circleBounds.contains(marker.getLatLng()) && distance <= circle.getRadius();
        }
        
    });
