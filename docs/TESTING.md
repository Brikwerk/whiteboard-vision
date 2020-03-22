# Testing

## Frontend Testing

The frontend server using the Jasmine testing framework to perform integration and unit testing on the JavaScript running in the client. Tests are run in browser through the "SpecRunner.html" template. Tests are included in the "/spec" directory under the "frontend_server" folder.

### Running the Tests

It's recommended to create a [Python virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment) to isolate testing components before beginning.

1. Navigate into the frontend_server directory and install the Python requirements with pip.

    ```bash
    pip install -r requirements.txt
    ```

2. Run the testing Flask server. This should automatically open your web browser and run the tests.

    ```bash
    python run_tests.py
    ```

## API Testing

The API server uses the PyTest testing framework to perform integration testing on the API. Flask's test_client is used to mock usage of the server. The tests are included in the "tests" directory under the "api_server" folder.

### Running the Tests

It's recommended to create a [Python virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment) to isolate testing components before beginning.

1. Navigate into the api_server directory and install the Python requirements with pip.

    ```bash
    pip install -r requirements.txt
    ```

2. Run the following command inside the "api_server" directory and test results will be displayed in your terminal.

    ```bash
    pytest
    ```