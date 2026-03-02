# Customer Satisfaction Feedback Form
## DOST Ilocos Region – Innovation Hub for GAD

A React Native mobile application for collecting customer satisfaction feedback.

## Features

- **Personal Information Collection**: Name, email, and contact number
- **Date of Visit Selection**: Easy date picker for visit date
- **Star Rating System**: 5-star ratings for:
  - Overall Satisfaction
  - Service Quality
  - Staff Courtesy & Professionalism
  - Facility & Environment
  - Response Time
- **Comments Section**: Free-text feedback area
- **Form Validation**: Ensures required fields are filled
- **Modern UI**: Clean, professional design with DOST branding colors

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

## Installation

1. Install dependencies:
```bash
npm install
```

or

```bash
yarn install
```

2. Start the Expo development server:
```bash
npm start
```

or

```bash
yarn start
```

3. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## Project Structure

```
CSF_IHUB/
├── App.js                 # Main application entry point
├── components/
│   └── FeedbackForm.js    # Main feedback form component
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
└── README.md             # This file
```

## Usage

1. Fill in your personal information (name and email are required)
2. Select your date of visit
3. Rate your experience using the star ratings (1-5 stars)
4. Add any additional comments or feedback
5. Submit the form

## Customization

To customize the form:
- Edit `components/FeedbackForm.js` to modify form fields
- Update styles in the `StyleSheet` object
- Change colors in the header and button styles
- Modify validation logic in the `validateForm` function

## Backend Integration

Currently, the form logs data to the console. To integrate with a backend:

1. Update the `handleSubmit` function in `FeedbackForm.js`
2. Replace the `console.log` with an API call to your backend
3. Handle success/error responses appropriately

Example:
```javascript
const response = await fetch('YOUR_API_ENDPOINT', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData),
});
```

## License

This project is created for DOST Ilocos Region – Innovation Hub for GAD.
