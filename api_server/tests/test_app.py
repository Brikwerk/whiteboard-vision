import pytest

from app import app


@pytest.fixture
def client():
    """Configuring a test server for use between each test"""

    app.config['TESTING'] = True

    with app.test_client() as client:
        yield client


def test_root_fetch(client):
    """Testing a fetch of the API server's root"""

    res = client.get('/')
    assert b'404 Not Found' in res.data


def test_api_get(client):
    """Testing an improper attempt to GET the API endpoint"""

    res = client.get('/v1/imagerecognition')
    assert b'405 Method Not Allowed' in res.data


def test_api_post_bad_data(client):
    """Testing POSTing bad data to the API endpoint"""

    res = client.post('/v1/imagerecognition', data={"image1.jpg": b'123456789'})
    assert b'{}' in res.data


def test_api_post_image(client):
    """Testing POSTing a bad image to the API endpoint"""

    res = None
    with open('test_images/demo_image_3.jpg', 'rb') as file:
        res = client.post(
            '/v1/imagerecognition',
            data={'image2.jpg': file}
        )

    assert b'"text": "100"' in res.data and \
        b'"text": "math"' in res.data and \
        b'"text": "lest"' in res.data and \
        b'"text": "pickup"' in res.data
