//Utilize necessary libraries
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <WiFi.h>
#include <WebServer.h>

// I2C and OLED config
#define I2C_SDA 21
#define I2C_SCL 22
#define OLED_ADDR 0x3C
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

// LED pins
#define GREEN_LED_PIN 5
#define YELLOW_LED_PIN 18
#define RED_LED_PIN 19

// Wi-Fi AP config
const char* ssid = "ESP32";        // AP SSID
const char* password = "awesome";  // AP Password

IPAddress local_ip(192, 168, 1, 1);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

// Globals for sensor and display
MAX30105 particleSensor;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Bitmap data for heart icons
static const unsigned char PROGMEM beat1_bmp[] = { 0x03, 0xC0, 0xF0, 0x06, 0x71, 0x8C, 0x0C, 0x1B, 0x06, 0x18, 0x0E, 0x02, 0x10, 0x0C, 0x03, 0x10,
                                                   0x04, 0x01, 0x10, 0x04, 0x01, 0x10, 0x40, 0x01, 0x10, 0x40, 0x01, 0x10, 0xC0, 0x03, 0x08, 0x88,
                                                   0x02, 0x08, 0xB8, 0x04, 0xFF, 0x37, 0x08, 0x01, 0x30, 0x18, 0x01, 0x90, 0x30, 0x00, 0xC0, 0x60,
                                                   0x00, 0x60, 0xC0, 0x00, 0x31, 0x80, 0x00, 0x1B, 0x00, 0x00, 0x0E, 0x00, 0x00, 0x04, 0x00 };

static const unsigned char PROGMEM beat2_bmp[] = { 0x01, 0xF0, 0x0F, 0x80, 0x06, 0x1C, 0x38, 0x60, 0x18, 0x06, 0x60, 0x18, 0x10, 0x01, 0x80, 0x08,
                                                   0x20, 0x01, 0x80, 0x04, 0x40, 0x00, 0x00, 0x02, 0x40, 0x00, 0x00, 0x02, 0xC0, 0x00, 0x08, 0x03,
                                                   0x80, 0x00, 0x08, 0x01, 0x80, 0x00, 0x18, 0x01, 0x80, 0x00, 0x1C, 0x01, 0x80, 0x00, 0x14, 0x00,
                                                   0x80, 0x00, 0x14, 0x00, 0x80, 0x00, 0x14, 0x00, 0x40, 0x10, 0x12, 0x00, 0x40, 0x10, 0x12, 0x00,
                                                   0x7E, 0x1F, 0x23, 0xFE, 0x03, 0x31, 0xA0, 0x04, 0x01, 0xA0, 0xA0, 0x0C, 0x00, 0xA0, 0xA0, 0x08,
                                                   0x00, 0x60, 0xE0, 0x10, 0x00, 0x20, 0x60, 0x20, 0x06, 0x00, 0x40, 0x60, 0x03, 0x00, 0x40, 0xC0,
                                                   0x01, 0x80, 0x01, 0x80, 0x00, 0xC0, 0x03, 0x00, 0x00, 0x60, 0x06, 0x00, 0x00, 0x30, 0x0C, 0x00,
                                                   0x00, 0x08, 0x10, 0x00, 0x00, 0x06, 0x60, 0x00, 0x00, 0x03, 0xC0, 0x00, 0x00, 0x01, 0x80, 0x00 };

const byte RATE_SIZE = 16;  // Defines the size of array for averaging
byte rates[RATE_SIZE];
byte rateSpot = 0;

long lastBeat = 0;  // Declare variables
float beatsPerMinute = 0;
int beatAvg = 0;

#define BUFFER_SIZE 100  // Ensures same buffer is used throughout
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];

int32_t spo2 = 0;
int8_t validSPO2 = 0;
int32_t heartRate = 0;
int8_t validHeartRate = 0;

bool fingerDetected = false;
bool newBeat = false;
bool newSpO2 = false;

WebServer server(80);

// LED blinking timing control
unsigned long greenLedStart = 0;
unsigned long yellowLedStart = 0;
unsigned long redLedStart = 0;

bool greenLedState = false;
bool yellowLedState = false;
bool redLedState = false;

unsigned long lastGreenToggle = 0;
unsigned long lastYellowToggle = 0;
unsigned long lastRedToggle = 0;

const unsigned long blinkInterval = 500;       // LED blink interval
const unsigned long conditionDuration = 5000;  // 5 second threshold

// Finger absence reset timer
static unsigned long fingerLostTime = 0;
const unsigned long fingerLostResetDelay = 10000;  // 10 second threshold

//Updates string number in html server every 2 seconds
void handleData() {
  String json = "{";
  json += "\"bpm\":" + String((int)beatsPerMinute) + ",";
  json += "\"avgbpm\":" + String((int)beatAvg) + ",";
  json += "\"spo2\":" + String(spo2) + ",";
  json += "\"bodytemp\":" + String(random(90, 99)) + ",";
  json += "\"systolic\":" + String(random(115, 125)) + ",";
  json += "\"diastolic\":" + String(random(79, 85));
  json += "}";
  server.send(200, "application/json", json);
}

// HTML template
String createHTML() {
  String str = "<!DOCTYPE html><html>";
  str += "<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, user-scalable=no\">";
  str += "<style>body{font-family:Arial,sans-serif;color:#444;text-align:center;}";
  str += ".title{font-size:30px;font-weight:bold;letter-spacing:2px;margin:40px 0;}";
  str += ".data{font-size:50px;color:#4285f4;}</style></head><body>";

  // JavaScript to periodically fetch sensor data JSON and update spans
  str += "<script>"
         "function fetchData() {"
         "  fetch('/data')"
         "    .then(function(response) { return response.json(); })"
         "    .then(function(data) {"
         "      document.getElementById('bpm').textContent = data.bpm;"
         "      document.getElementById('avgbpm').textContent = data.avgbpm;"
         "      document.getElementById('spo2').textContent = data.spo2;"
         "      document.getElementById('bodytemp').textContent = data.bodytemp;"
         "      document.getElementById('systolic').textContent = data.systolic;"
         "      document.getElementById('diastolic').textContent = data.diastolic;"
         "    })"
         "    .catch(function(err) { console.error('Fetch error:', err); });"
         "}"
         "setInterval(fetchData, 2000);"
         "window.onload = fetchData;"
         "</script>";
  // HTML inputs
  str += "<h1 class=\"title\">Heart Rate & SpO2 Monitor</h1>";
  str += "<p>HR (BPM): <span <span id=\"bpm\" class=\"data\">" + String((int)beatsPerMinute) + "</span></p>";
  str += "<p>AVG HR (BPM): <span <span id=\"avgbpm\" class=\"data\">" + String(beatAvg) + "</span></p>";
  str += "<p>SpO2 (%): <span id=\"spo2\" class=\"data\">" + String(spo2) + "</span></p>";
  str += "<p>BodyTemp (F): <span id=\"bodytemp\" class=\"data\">" + String(random(90, 99)) + "</span></p>";
  str += "<p>Systolic (mmHg): <span id=\"systolic\" class=\"data\">" + String(random(115, 125)) + "</span></p>";
  str += "<p>Diastolic (mmHg): <span id=\"diastolic\" class=\"data\">" + String(random(79, 85)) + "</span></p>";
  str += "</body></html>";
  return str;
}

// HTTP handlers
void handleRoot() {
  server.send(200, "text/html", createHTML());
}
void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

void setup() {
  Wire.begin(I2C_SDA, I2C_SCL, 400000);
  Serial.begin(9600);  // Baut rate

  // Leds
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(YELLOW_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(YELLOW_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println(F("Display allocation failed"));
    while (1) delay(10);
  }
  //Welcome message
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(30, 17);
  display.println(F("Please place"));
  display.setCursor(30, 27);
  display.println(F("the fingertip"));
  display.setCursor(7, 37);
  display.println(F("on the sensor module"));
  display.setCursor(30, 47);
  display.println(F("and wait..."));
  display.display();

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println(F("MAX30105 not found. Check wiring/power."));
    while (1) delay(10);
  }
  //Parameters set for sensor
  particleSensor.setup(60, 8, 2, 3200, 411, 16384);
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
  //Web server information
  WiFi.softAP(ssid, password);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  Serial.println(WiFi.softAPIP());

  server.on("/", handleRoot);
  server.onNotFound(handleNotFound);
  server.on("/data", handleData);
  server.begin();
}

void loop() {
  server.handleClient();

  //Declare sensor values needed for calculations
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();
  bool currentFingerDetected = (irValue > 50000);

  if (currentFingerDetected) {
    // Finger detected: reset timer
    fingerLostTime = 0;
  } else {

    // Finger not detected: start or continue timer
    if (fingerLostTime == 0) {
      fingerLostTime = millis();
    } else if ((millis() - fingerLostTime) > fingerLostResetDelay) {

      // Reset BPM and average after 10 seconds of no finger
      beatsPerMinute = 0;
      beatAvg = 0;
      memset(rates, 0, sizeof(rates));
      rateSpot = 0;
      fingerLostTime = millis();
    }
  }
  fingerDetected = currentFingerDetected;

  //BPM algorithim
  if (fingerDetected && checkForBeat(irValue)) {
    unsigned long now = millis();
    long delta = now - lastBeat;

    if (delta > 300) {
      lastBeat = now;
      beatsPerMinute = 60000.0 / delta;

      if (beatsPerMinute > 20 && beatsPerMinute < 180) {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;

        int sum = 0;
        for (byte i = 0; i < RATE_SIZE; i++) sum += rates[i];
        beatAvg = sum / RATE_SIZE;

        newBeat = true;
      }
    }
  }

  // spO2 Algorithim
  static int bufferCount = 0;
  irBuffer[bufferCount] = irValue;
  redBuffer[bufferCount] = redValue;
  bufferCount++;

  if (bufferCount >= BUFFER_SIZE) {
    maxim_heart_rate_and_oxygen_saturation(irBuffer, BUFFER_SIZE, redBuffer,
                                           &spo2, &validSPO2, &heartRate, &validHeartRate);
    bufferCount = 0;
    newSpO2 = validSPO2 && validHeartRate;

    // Prevent negative SpO2 values
    if (spo2 < 0) {
      spo2 = 0;
      validSPO2 = 0;
    }
  }

  static bool lastFingerDetected = false;
  //Display code
  if (fingerDetected || lastFingerDetected) {
    display.clearDisplay();

    if (fingerDetected) {
      display.drawBitmap(18, 17, beat2_bmp, 32, 32, WHITE);
      display.setTextSize(2);
      display.setTextColor(WHITE);
      display.setCursor(60, 17);
      display.println(F("BPM:"));
      display.setCursor(60, 37);
      display.println((int)beatsPerMinute);
      display.setTextSize(1);
      display.setCursor(60, 57);
      display.print(F("SpO2: "));
      if (validSPO2)
        display.println(spo2);
      else
        display.println(F("--"));
    } else {
      display.setTextSize(1);
      display.setTextColor(WHITE);
      display.setCursor(30, 17);
      display.println(F("Please place"));
      display.setCursor(30, 27);
      display.println(F("your finger"));
      display.setCursor(23, 37);
      display.println(F("on the red LED"));
      display.setCursor(30, 47);
      display.println(F("and wait..."));
    }
    display.display();
  }
  lastFingerDetected = fingerDetected;

  // LED logic

  unsigned long currentMillis = millis();

  // Green LED: BPM > 51 for 5+ seconds
  if (beatsPerMinute > 51) {
    if (greenLedStart == 0) greenLedStart = currentMillis;
    if ((currentMillis - greenLedStart) >= 5000) {
      // Blink green LED
      if (currentMillis - lastGreenToggle >= blinkInterval) {
        greenLedState = !greenLedState;
        digitalWrite(GREEN_LED_PIN, greenLedState);
        lastGreenToggle = currentMillis;
      }
    }
  } else {
    greenLedStart = 0;
    greenLedState = false;
    digitalWrite(GREEN_LED_PIN, LOW);
  }

  // Yellow LED: BPM between 30 and 50 for 5+ seconds
  if (beatsPerMinute >= 30 && beatsPerMinute <= 50) {
    if (yellowLedStart == 0) yellowLedStart = currentMillis;
    if ((currentMillis - yellowLedStart) >= 5000) {
      if (currentMillis - lastYellowToggle >= blinkInterval) {
        yellowLedState = !yellowLedState;
        digitalWrite(YELLOW_LED_PIN, yellowLedState);
        lastYellowToggle = currentMillis;
      }
    }
  } else {
    yellowLedStart = 0;
    yellowLedState = false;
    digitalWrite(YELLOW_LED_PIN, LOW);
  }

  // Red LED: BPM < 30 for 5+ seconds
  if (beatsPerMinute > 0 && beatsPerMinute < 30) {
    if (redLedStart == 0) redLedStart = currentMillis;
    if ((currentMillis - redLedStart) >= 5000) {
      if (currentMillis - lastRedToggle >= blinkInterval) {
        redLedState = !redLedState;
        digitalWrite(RED_LED_PIN, redLedState);
        lastRedToggle = currentMillis;
      }
    }
  } else {
    redLedStart = 0;
    redLedState = false;
    digitalWrite(RED_LED_PIN, LOW);
  }
  // Serial prints every second of BPM, spO2
  static unsigned long lastSerialPrint = 0;
  if (millis() - lastSerialPrint > 1000) {
    lastSerialPrint = millis();
    Serial.print(F("BPM="));
    Serial.print(beatsPerMinute);
    Serial.print(F(", Avg BPM="));
    Serial.print(beatAvg);
    Serial.print(F(", SpO2="));
    Serial.println(spo2);
  }
}
