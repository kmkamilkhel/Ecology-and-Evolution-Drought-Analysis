# Long-Term Analysis of Vegetation Stress and Resilience to Climatic Variability (2001-2023)

This repository provides resources, scripts, and methodologies for analyzing vegetation stress and resilience to climatic variability using **Kernel NDVI (kNDVI)** and **Vegetation Health Index (VHI)**. The research focuses on Pakistan's diverse ecological regions from 2001 to 2023, exploring vegetation-climate interactions, drought impacts, and long-term trends.

---

## Table of Contents

1. [Overview](#overview)
2. [Study Area](#study-area)
3. [Datasets](#datasets)
4. [kNDVI Calculation](#kndvi-calculation)
5. [VHI Calculation](#vhi-calculation)
6. [Anomaly Detection](#anomaly-detection)
7. [How to Use the Repository](#how-to-use-the-repository)
8. [References](#references)

---

## Overview

### Key Highlights:
- **Objectives**:
  - Analyze long-term vegetation stress and short-term recovery using kNDVI and VHI.
  - Explore drought impacts across Pakistan's provinces: Baluchistan (BLC), KGA (Gilgit-Baltistan, Azad Jammu and Kashmir), Punjab (PJB), and Sindh (SND).
  - Investigate correlations between vegetation indices (kNDVI, VHI) and climatic variables (SPEI, PDSI, temperature, and precipitation).
- **Significant Findings**:
  - kNDVI captures persistent vegetation decline in drought-prone regions like BLC and KGA.
  - VHI reflects short-term recovery trends, especially in moisture-responsive regions like SND.

---

## Study Area

The study encompasses Pakistan's diverse ecological regions:
1. **Baluchistan (BLC)**:
   - Arid and semi-arid climates with sparse vegetation.
   - Persistent stress due to moisture deficits and rising temperatures.
2. **KGA (Gilgit-Baltistan, Azad Jammu, and Kashmir)**:
   - Mountainous terrain with diverse precipitation patterns.
   - Sensitive to seasonal and long-term climatic changes.
3. **Punjab (PJB)**:
   - Agricultural heartland with moderate precipitation.
   - Vegetation under stress due to temperature increases and periodic droughts.
4. **Sindh (SND)**:
   - Arid region including the Thar Desert.
   - Vegetation responds rapidly to occasional monsoonal rains.

Refer to Figure 1 in the paper for detailed maps of elevation gradients and land cover classifications.

---

## Datasets

The analysis integrates optical, thermal, and climatic datasets, ensuring spatial and temporal consistency.

| **Dataset**             | **Source**         | **Spatial Resolution** | **Temporal Resolution** | **Notes**                       |
|--------------------------|--------------------|-------------------------|--------------------------|----------------------------------|
| Landsat 5, 7, 9 (SR)    | GEE               | 30 meters              | Monthly                 | Reflectance data for kNDVI.     |
| Land Surface Temperature | Landsat           | 30 meters              | Monthly                 | Derived from thermal bands.     |
| Precipitation            | TerraClimate      | 4 km                   | Monthly                 | High-resolution climatic data.  |
| PDSI                    | TerraClimate      | 4 km                   | Monthly                 | Drought severity index.         |
| SPEI                    | SPEIbase          | 5.6 km                 | Monthly                 | Standardized precipitation index.|

---

## kNDVI Calculation

### Methodology:
The **Kernel NDVI (kNDVI)** was calculated using Landsat imagery (2001-2023). Unlike traditional NDVI, kNDVI incorporates a Gaussian kernel function to model non-linear vegetation reflectance relationships, enhancing its sensitivity in densely vegetated areas.

#### Formula:
$$
kNDVI = \tanh{\left(\frac{(NIR - Red)^2}{2\sigma^2}\right)}
$$


- \( \text{NIR} \): Reflectance in the near-infrared spectrum.
- \( \text{Red} \): Reflectance in the red spectrum.
- \( \sigma \): Estimated for each region to account for local vegetation variability.

#### Steps:
1. **Cloud Masking**: Exclude clouds, shadows, and snow.
2. **Sigma Estimation**:
   \[
   \sigma = \frac{1}{N} \sum_{i=1}^N |NIR_i - Red_i|
   \]
3. **Dynamic Thresholding**: Refine anomalies using quantile regression.
4. **Export**: Generate annual and seasonal kNDVI rasters.

Scripts:
- [kNDVI Annual Calculation](https://github.com/kmkamilkhel/Ecology-and-Evolution-Drought-Analysis/blob/main/Kndvi_Annual_Pak.js)
- [kNDVI Seasonal Calculation](https://github.com/kmkamilkhel/Ecology-and-Evolution-Drought-Analysis/blob/main/Kndvi_Seasonal_Pak.js)

---

## VHI Calculation

The **Vegetation Health Index (VHI)** integrates:
1. **Vegetation Condition Index (VCI)**:
   \[
   VCI = \frac{kNDVI - kNDVI_{min}}{kNDVI_{max} - kNDVI_{min}} \times 100
   \]
2. **Temperature Condition Index (TCI)**:
   \[
   TCI = \frac{LST_{max} - LST}{LST_{max} - LST_{min}} \times 100
   \]
3. **Final VHI**:
   \[
   VHI = \alpha \cdot VCI + (1 - \alpha) \cdot TCI
   \]
   - \( \alpha = 0.5 \): Equal weight for VCI and TCI.

Scripts:
- [VHI Calculation](./vhi_calculation.js)

---

## Anomaly Detection

### Method:
Annual anomalies for kNDVI, SPEI, PDSI, VHI, temperature, and precipitation were calculated:
\[
X_{anomaly(i,j,t)} = X_{(i,j,t)} - X_{mean(i,j)}
\]

Where:
- \( X_{mean(i,j)} \): Long-term mean for pixel \( (i,j) \).
- \( X_{(i,j,t)} \): Value at pixel \( (i,j) \) in year \( t \).

Scripts:
- [Anomaly Detection](./anomaly_detection.js)

---

## How to Use the Repository

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/vegetation-climatic-analysis.git
   cd vegetation-climatic-analysis
