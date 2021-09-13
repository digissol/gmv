import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import MapGL, { Marker } from '@urbica/react-map-gl';
import Cluster from '@urbica/react-map-gl-cluster';
//import useSwr from "swr";
import { FaPiedPiperPp, FaProductHunt } from 'react-icons/fa';
import "./App.css";

export default function App() {

  const [viewport, setViewport] = useState({
    latitude: 12.4578,
    longitude: 16.55445,
    zoom: 1.5
  });

  const style = {
    width: '20px',
    height: '20px',
    color: '#fff',
    background: '#00f',
    borderRadius: '20px',
    textAlign: 'center'
  };

  const projet = {
    width: '20px',
    height: '20px',
    color: '#fff',
    background: 'transparent',
    borderRadius: '20px',
    textAlign: 'center',
    strokeWidth: 0,
    fontSize: "40px"
  };
  const partenaire = {
    width: '20px',
    height: '20px',
    color: '#fff',
    background: 'transparent',
    borderRadius: '20px',
    textAlign: 'center',
    strokeWidth: 0,
    fontSize: "4em"
  };

  const style_partenaire = {
    width: '20px',
    height: '20px',
    color: '#fff',
    background: '#f00',
    borderRadius: '20px',
    textAlign: 'center'
  };

  const style_projet= {
   color: "red",
  fontSize: "100px",
  height: "100px",
  };

  const ClusterMarker = ({ longitude, latitude, pointCount }) => (
    <Marker longitude={longitude} latitude={latitude}>
      <div style={{ ...style, background: 'orange' }}>{pointCount}</div>
    </Marker>
  );

    // all geolocations
  var glocations_restruct = [];
  var glocations_restruct_no_duplicate_id = []; //avoid duplicata
  const [gLocations, setGLocations] = useState([]);
  useEffect(() => {
   
    const url = "http://gmv/geolocations/?_format=json";
    fetch(url)
      .then(res => res.json())
      .then(
        (result) => {
          result.slice(0, 2000).forEach((point) => 
            { 
              if (point.projet_id && !glocations_restruct_no_duplicate_id.includes(point.projet_id))//in case in a project share between many partenaires..
              {
                  glocations_restruct.push(
                  {
                    id: point.projet_id,
                    title: point.projet_title,
                    type: "projet",
                    properties: { cluster: false, glocationId: point.projet_id},
                    geometry: {
                      coordinates: [
                        parseFloat(JSON.parse(point.projet_localisation).coordinates[1]),//longitude
                        parseFloat(JSON.parse(point.projet_localisation).coordinates[0]), //latitude
                      ]
                    }
                  }); 

                  glocations_restruct_no_duplicate_id.push(point.projet_id);                
              }

              if (point.partenaire_id && !glocations_restruct_no_duplicate_id.includes(point.partenaire_id))//in case in a project share between many partenaires..
              {
                  glocations_restruct.push(
                  {
                    id: point.partenaire_id,
                    title: point.partenaire_title,
                    type: "partenaire",
                    properties: { cluster: false, glocationId: point.partenaire_id},
                    geometry: {
                      coordinates: [
                        parseFloat(JSON.parse(point.partenaire_localisation).coordinates[1]),//longitude
                        parseFloat(JSON.parse(point.partenaire_localisation).coordinates[0]), //latitude
                      ]
                    }
                  });

                  glocations_restruct_no_duplicate_id.push(point.partenaire_id);
              }
                              
            }
          );

          setGLocations(glocations_restruct);
          console.log("gLocations.length", glocations_restruct);
        }
      )
      .catch(
        (error) => {
         
        }
      )
  }, [])

  
return (
  <MapGL
    style={{ width: '100%', height: '400px' }}
    //mapStyle='mapbox://styles/mapbox/satellite-v9'
    mapStyle='mapbox://styles/mapbox/light-v9'
    //accessToken={MAPBOX_ACCESS_TOKEN}
    accessToken="pk.eyJ1IjoibW1zb3ciLCJhIjoiY2t0YmFydjB1MXR5NDJ1cWxxZWhjZnYwciJ9.CZER0uLmoE91iAgIptvD3g"
    onViewportChange={newViewport => {
          setViewport({ ...newViewport });
        }}
    {...viewport}
  >
    <Cluster radius={80} extent={512} nodeSize={64} component={ClusterMarker}>
      {
         
            gLocations.map((point) => { 
             
              console.log("id", point.id);

              if (point.type == 'partenaire')
              {
                 return(                 
                  <Marker
                    key={point.id}
                    longitude={point.geometry.coordinates[1]}
                    latitude={point.geometry.coordinates[0]}
                  >
                   <button className={point.type} strokeWidth="0">
                       <FaPiedPiperPp color="#aaD100" size='2em' title={point.title}/>
                    </button>

                  </Marker>        
                );
              }

              if (point.type == 'projet')
              {           
                 return(
                  
                  <Marker
                    key={point.id}
                    longitude={point.geometry.coordinates[1]}
                    latitude={point.geometry.coordinates[0]}
                  >
                    <button style={{outline: 'none !important;', boxShadow:"none !important;"}} className={point.type} strokeWidth="0">
                       <FaProductHunt color="#00D100" size='1.6em' title={point.title}/>
                    </button>
                  </Marker>
                );
              }
            }
          ) 
     }
    </Cluster>
  </MapGL>
  );
}