import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import MapGL, { Marker } from '@urbica/react-map-gl';
import Cluster from '@urbica/react-map-gl-cluster';
//import useSwr from "swr";
import { FaPiedPiperPp, FaProductHunt } from 'react-icons/fa';
import "./App.css";
import {ReactSearchAutocomplete} from "react-search-autocomplete";
import useFetch from "./useFetch";
import Select, { components } from "react-select";

export default function App() {

  const base = process.env.REACT_APP_BASE_URL;
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

  //terms taxonomy partners
  let partitems = []
  let themaitems = [] //thematiques partenaires
  let realitems = [] // type de realisations projet
  //let urlpartner = base+'/api/taxonomy_term/cateegorie_partenaire';
  let urlpartner = 'http://gmv/api/taxonomy_term/cateegorie_partenaire';
  console.log("urlpartner", urlpartner)
  const {data:partners, isPendingpartners, errorpartners} = useFetch(urlpartner);
  console.log("partners:", partners);
  if(partners){
      partners.data.map((partner) => (
          partitems.push({ value : partner.attributes.drupal_internal__tid, label: partner.attributes.name})
      ));
  }

  //terms taxonomy realisations projets
  let urltypereal = 'http://gmv/api/taxonomy_term/realisation';
  console.log("urltypereal", urltypereal)
  const {data:typereals, isPendingtypereals, errortypereals} = useFetch(urltypereal);
  console.log("typereals:", typereals);
  if(typereals){
      typereals.data.map((typereal) => (
          realitems.push({ value : typereal.attributes.drupal_internal__tid, label: typereal.attributes.name})
      ));
  }

  //terms taxonomy thematiques partners
  let urlthema = 'http://gmv/api/taxonomy_term/thematique';
  console.log("urlthema", urlthema)
  const {data:themas, isPendingthemas, errorthemas} = useFetch(urlthema);
  console.log("themas:", themas);
  if(themas){
      themas.data.map((thema) => (
          themaitems.push({ value : thema.attributes.drupal_internal__tid, label: thema.attributes.name})
      ));
  }
  
  const [name, setName] = useState('');
  const [selectedOption, setselectedOption] = useState('');
  const [selectedOptionTypeReal, setselectedOptionTypeReal] = useState(null);
  const [selectedOptionThema, setselectedOptionThema] = useState('');

  var urlbase = "http://gmv/geolocations/?_format=json"
  const [url, setUrl] = useState(urlbase);

  const handleChangeSelect = (selectedOption) => { 
       //new url
       var newurl = urlbase + "&field_categorie_target_id=" + selectedOption.value;
       setUrl(newurl);
       setselectedOption(selectedOption);
       console.log("new url", newurl);
        
  };

  //type realisations projet
  const handleChangeTypeReal = (selectedOption) => { 
       //new url
       console.log("selected multi Option", selectedOption)
       let joinquery = selectedOption.map( (elt, index) => {
        console.log("selected multi Option elt", elt)
        return `field_type_realisation_target_id\[`+index + `\]=`+elt.value;
       });
       console.log("selected multi Option elt", joinquery);
       let newurl = urlbase.concat("&", joinquery.join('&'));
       console.log("selected multi Option joinquery", newurl);
       setUrl(newurl);
       //setselectedOptionTypeReal(selected);
       console.log("new url", newurl);
        
  };

  //thematique partenaire
  const handleChangeThema = (selectedOption) => { 
       //new url
       var newurl = urlbase + "&field_thematique_target_id=" + selectedOption.value;
       setUrl(newurl);
       setselectedOptionThema(selectedOption);
       console.log("new url", newurl);
        
  };

  const handleSubmit = () => {
    // the item selected
    /*console.log(item);
    const results = annonces.data.filter((annonce) => {
        return annonce.relationships.field_affiliation.data.id.startsWith(item.id) ;
        // Use the toLowerCase() method to make it case-insensitive
      });
    setFoundAnnonces(results);*/

    //new url
    url = urlbase + "&partenaire_categorie=" + selectedOption;
    alert(url);
    console.log("new url", url);
    setUrl(url);
  }
  const handleNameChange = (e) => {
    const keyword = e.target.value;
    setName(keyword);
  };

  const Option = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
        />{" "}
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

    // all geolocations
  var glocations_restruct = [];
  var glocations_restruct_no_duplicate_id = []; //avoid duplicata
  const [gLocations, setGLocations] = useState([]);
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(
        (result) => {
          console.log("new url for looping", url);
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
  }, [url])

  
return (
  <React.StrictMode>
  <div className="carto"> 
     <div className="row filtering">       

             
              <div className="col-md-3">
               <label>Par catégorie</label>
                  <Select options={partitems}
                  value={selectedOption}
                  onChange={handleChangeSelect}
                  placeholder="Sélectionner"
                  />
              </div>
             
              <div className="col-md-3">
               <label>Par thématique</label>
                  <Select options={themaitems}
                  value={selectedOptionThema}
                  onChange={handleChangeThema}
                  placeholder="Sélectionner"
                  />
              </div>
               
              <div className="col-md-3">
              <label>Par type de réalisation</label>
                  <Select
                 isMulti
                  name="typerealisations"
                  options={realitems}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Sélectionner"
                
                  
                 
                  onChange={handleChangeTypeReal}
                 
                  />
              </div>
              <div className="col-md-3">
                <input
                    type="search"
                    value={name}
                    //onChange={handleNameChange}
                    className="input"
                    placeholder="Saisir un mot.."
                />            
              </div>
              <div className="col-md-3">
                  <input type="submit" value="Chercher" onSubmit={handleSubmit} />
              </div>

    </div>
    <div className="row the_mapbox">
      <MapGL
        style={{ width: '100%', height: '400px' , marginTop: '15px'}}
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
                 
                  //console.log("id", point.id);

                  if (point.type == 'partenaire')
                  {
                     return(                 
                      <Marker
                        key={point.id}
                        longitude={point.geometry.coordinates[1]}
                        latitude={point.geometry.coordinates[0]}
                      >
                       <button className={point.type}>
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
                        <button style={{outline: 'none !important;'}} className={point.type}>
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
     </div> 
    </div> 
  </React.StrictMode>);
}