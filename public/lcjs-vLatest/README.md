# Performance Test LCJS-vLatest

Using latest version (currently v8.0.2), requires a trial license to test 

## Setup

You need to create a file called `lcjs-license.js` in this directory with your LightningChart JS trial license. The file should contain:

```javascript
const license = {
    license: "YOUR_LICENSE_KEY_HERE",
    licenseInformation: {
        appTitle: "LightningChart JS Trial",
        company: "LightningChart Ltd."
    }
};
```

Replace `YOUR_LICENSE_KEY_HERE` with your actual trial license key from LightningChart.

## Size

| File       | Size  |
|------------|-------|
|lcjs.iife.js| 1.68M |
