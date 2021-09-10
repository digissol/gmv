import React, { useState, useRef } from "react";
import useSwr from "swr";
import ReactMapGL, { Marker, FlyToInterpolator } from "react-map-gl";
import useSupercluster from "use-supercluster";
import { FaCertificate } from 'react-icons/fa';
import "./App.css";

const fetcher = (...args) => fetch(...args).then(response => response.json());

export default function App() {
 const [viewport, setViewport] = useState({
    latitude: 14.4974,
    longitude: -14.4524,
    width: "100vw",
    height: "100vh",
    zoom: 2
  });
  const mapRef = useRef();

  const url =
    "http://gmv/geolocations/?_format=json";
  //#"https://data.police.uk/api/crimes-street/all-crime?lat=52.629729&lng=-1.131592&date=2019-10";
  const { data, error } = useSwr(url, { fetcher });
  const crimes = data && !error ? data.slice(0, 2000) : [];
  const points = crimes.map(crime => ({
    type: "Feature",
    properties: { cluster: false, crimeId: crime.uuid_1, category: crime.title },
    geometry: {
      type: "Point",
      coordinates: JSON.parse(crime.field_localisation).coordinates
    }
  }));

  const bounds = mapRef.current
    ? mapRef.current
        .getMap()
        .getBounds()
        .toArray()
        .flat()
    : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewport.zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  return (
    <div>
     <h1 class="entete">Cartographie acteurs et réalisations</h1>
      <ReactMapGL
        {...viewport}
        maxZoom={20}
        //mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxApiAccessToken="pk.eyJ1IjoibW1zb3ciLCJhIjoiY2t0YmFydjB1MXR5NDJ1cWxxZWhjZnYwciJ9.CZER0uLmoE91iAgIptvD3g"
        onViewportChange={newViewport => {
          setViewport({ ...newViewport });
        }}
        ref={mapRef}
      >
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const {
            cluster: isCluster,
            point_count: pointCount
          } = cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                latitude={latitude}
                longitude={longitude}
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / points.length) * 20}px`,
                    height: `${10 + (pointCount / points.length) * 20}px`
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      20
                    );

                    setViewport({
                      ...viewport,
                      latitude,
                      longitude,
                      zoom: expansionZoom,
                      transitionInterpolator: new FlyToInterpolator({
                        speed: 2
                      }),
                      transitionDuration: "auto"
                    });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker
              key={`crime-${cluster.properties.crimeId}`}
              latitude={latitude}
              longitude={longitude}
            >
              <button className="crime-marker">
                <FaCertificate color="#00D100" title="Project"/>
              </button>
            </Marker>
          );
        })}
      </ReactMapGL>
    </div>
  );
}
