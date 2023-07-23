# react-qrbar-scanner

**react-qrbar-scanner** is a simple React component that allows you to use the client's webcam to read barcodes and QR codes. It supports various barcode formats and provides an easy-to-use interface to capture and decode codes from real-time video.
This component uses the `@zxing/library` for QR code detection and the Web Media API (`navigator.mediaDevices.getUserMedia()`) to access the device's camera.

Note: For proper functionality, make sure to implement a way to request camera access permissions in the application that uses this component.

## Installation

To install MultiCodeReader, use npm:

```bash
npm install @kuiik/react-qrbar-scanner
```

Or with yarn:

```bash
yarn add @kuiik/react-qrbar-scanner
```

## Development

To run test with Nx:
```bash
nx run react-qrbar-scanner:test
```

To run build with Nx:
```bash
nx run react-qrbar-scanner:build
```

## Usage

To use MultiCodeReader in your React application, simply import it and add it to your component:

```jsx
import React from "react";
import QrbarScanner from "@kuiik/react-qrbar-scanner";

function App() {
  const [data, setData] = React.useState("Not Found");

  return (
    <>
      <QrbarScanner
        width={500}
        height={500}
        onUpdate={(err, result) => {
          if (result) setData(result.text);
          else setData("Not Found");
        }}
      />
      <p>{data}</p>
    </>
  );
}

export default App;
```

## Options

- `onUpdate`: A callback function invoked when a QR code is detected. It receives the scanning result and an optional error.
- `isCapturing`: A boolean value that determines whether the component is actively capturing and processing the video stream from the camera.
- `onMultipleCameras` (optional): A callback function called when information about multiple available cameras on the device is obtained.
- `delay` (optional): The time in milliseconds to wait between component updates while capturing QR codes.
- `facingMode` (optional): The camera direction to use, which can be 'environment' for the rear camera or 'user' for the front camera.
- `width` (optional): The width of the scanning component.
- `height` (optional): The height of the scanning component.

## Supported Formats

| 1D product | 1D industrial | 2D          |
| ---------- | ------------- | ----------- |
| EAN-8      | CODABAR       | Aztec       |
| EAN-13     | Code 39       | Data Matrix |
| UPC-A      | Code 93       | MaxiCode    |
| UPC-E      | Code 128      | PDF417      |
|            | ITF           | QR Code     |
|            | UPC/EAN       | RSS 14      |
|            |               | RSS EXPANDED|

## Contributing

We welcome contributions to the MultiCodeReader component! To contribute, please follow these steps:

Fork the repository and create a new branch for your feature or bug fix.
Make your changes and ensure that all tests pass.
Commit your changes and push them to your fork.
Create a pull request and provide a detailed description of your changes.

Things to improve:
- Expand Test Coverage: Improve and expand the test suite for the `QrbarScanner` component to cover more use cases and edge scenarios. This will help ensure the stability and reliability of the component.
- Implement CI/CD: Set up Continuous Integration (CI) and Continuous Deployment (CD) workflows to automatically run tests on every code change and deploy the library to the appropriate package registry or hosting platform.
- Enhance CSS Styling: Improve the styling of the `QrbarScanner` component by enhancing the CSS styles to make it more visually appealing and user-friendly.
- Accessibility Improvements: Implement accessibility best practices to ensure the component is usable by all users, including those with disabilities or using assistive technologies.
- Code Documentation: Enhance code comments and add inline documentation to make the codebase more understandable and maintainable for contributors and users.
- Performance Optimization: Look for areas to optimize performance, such as reducing unnecessary re-renders or optimizing resource usage during QR code scanning.
- Bug Fixes: Address any existing issues or bugs reported by users or contributors to improve the overall quality and stability of the component.
- Feature Requests: Consider and implement additional features or improvements requested by users or the community.
- Examples and Demos: Provide more usage examples and interactive demos in the README or a separate documentation page to showcase the capabilities of the `QrbarScanner` component.

## Contributors:

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://avatars2.githubusercontent.com/u/58745412?s=50&u=6f39dce34dda3cec7ca7eedb6981225e34b46a0a&v=4" width="45"></a> [juparog](https://github.com/juparog).

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://avatars.githubusercontent.com/u/20565331??s=50&u=6f39dce34dda3cec7ca7eedb6981225e34b46a0av=4" width="45"></a> [efrainrodriguez](https://github.com/efrainrodriguez).

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

Power By: <a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://avatars.githubusercontent.com/u/136282871?s=400&u=870449bd0ef533bc3528e4d35bc88c62a06a19a2&v=4" width="45"></a> [](https://github.com/KuiikTech)
