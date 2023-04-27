import pandas as pd
import requests
import json

# read the CSV data from the given URL
data = pd.read_csv("http://chargepoints.dft.gov.uk/api/retrieve/registry/format/csv", 
                    lineterminator='\n',
                    low_memory=False)

# drop duplicate rows based on the "chargeDeviceID" column
data.drop_duplicates(subset=['chargeDeviceID'], keep='first', inplace=True)

# extract the required columns
columns = [
    'chargeDeviceID',
    'name', 
    'latitude', 
    'longitude', 
    'town', 
    'county', 
    'postcode', 
    'deviceOwnerName', 
    'deviceControllerName', 
    'deviceNetworks', 
    'chargeDeviceStatus', 
    'dateCreated', 
    'dateUpdated', 
    'paymentRequired', 
    'subscriptionRequired', 
    'locationType', 
    'access24Hours', 
    'connector1ID', 
    'connector1Type', 
    'connector1RatedOutputKW', 
    'connector1OutputCurrent', 
    'connector1RatedVoltage', 
    'connector1ChargeMethod', 
    'connector1ChargeMode', 
    'connector1TetheredCable', 
    'connector1Status', 
    'connector2ID', 
    'connector2Type', 
    'connector2RatedOutputKW', 
    'connector2OutputCurrent', 
    'connector2RatedVoltage', 
    'connector2ChargeMethod', 
    'connector2ChargeMode', 
    'connector2TetheredCable', 
    'connector2Status'
]
data = data[columns]

data['access24Hours'] = data['access24Hours'].fillna(0)

# Update longitude values for ChargePlace Scotland controllers (values positive should be negative)
chargeplace_scotland = data['deviceControllerName'] == 'ChargePlace Scotland'
data.loc[chargeplace_scotland & (data['longitude'] > 2), 'longitude'] = data.loc[chargeplace_scotland & (data['longitude'] > 2), 'longitude'] * -1

#flipping longitude of datapoints which are incorrect
data.loc[data['chargeDeviceID'] == '935f3eec582eb6b298c1625ba73c4e8a', ['longitude']] = data.loc[data['chargeDeviceID'] == '935f3eec582eb6b298c1625ba73c4e8a', ['longitude']] * -1
data.loc[data['chargeDeviceID'] == '4c8e3dd932db78e0df6d190818124b4a', ['longitude']] = data.loc[data['chargeDeviceID'] == '4c8e3dd932db78e0df6d190818124b4a', ['longitude']] * -1
data.loc[data['chargeDeviceID'] == '8bddf56bd1be124e99f7b902c4e5b203', ['longitude']] = data.loc[data['chargeDeviceID'] == '8bddf56bd1be124e99f7b902c4e5b203', ['longitude']] * -1

# Update location values for locations where long and lat wrong way around
data.loc[data['chargeDeviceID'] == '53d474266f0eba48e4df65250fe2c56b', ['latitude', 'longitude']] = data.loc[data['chargeDeviceID'] == '53d474266f0eba48e4df65250fe2c56b', ['longitude', 'latitude']].values
data.loc[data['chargeDeviceID'] == '98555e2a46b8f678592b7caba74504cf', ['latitude', 'longitude']] = data.loc[data['chargeDeviceID'] == '98555e2a46b8f678592b7caba74504cf', ['longitude', 'latitude']].values

#Long and lat both 5, got values from postcode
data.loc[data['chargeDeviceID'] == '906a7cf4657ab3f2f031889a0ed25057', ['latitude', 'longitude']] = [50.7851, -1.606]

# Replace longitude with postcode longitude if it's over 50
for index, row in data.iterrows():
    if row['longitude'] > 50:
        postcode = row['postcode']
        postcode_request = requests.get(f"https://api.postcodes.io/postcodes/{postcode}")
        postcode_data = json.loads(postcode_request.text)
        if postcode_data['status'] == 200:
            longitude = postcode_data['result']['longitude']
            data.loc[index, 'longitude'] = longitude

# Delete chargers from SureCharge with no location and bp pulse st lucia
delete_SureCharge = (data['deviceControllerName'] == 'SureCharge/FM Conway') & (data['latitude'] == 0)
data = data.drop(data[delete_SureCharge].index)
data = data[data['chargeDeviceID'] != '1afd756ec91b443657761ee608709ad4']

data.to_csv('csv/chargers.csv', index=True)