import pandas as pd

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

data.to_csv('csv/chargers.csv', index=True)