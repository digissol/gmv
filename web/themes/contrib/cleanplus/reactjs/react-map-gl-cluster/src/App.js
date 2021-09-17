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

  let urlbase = "http://gmv/"
  let urlbase_geolocations = urlbase + "geolocations/?_format=json"
  let url_full_query = urlbase_geolocations //by default no filter
  const [url_full_query_tab, seturl_full_query_tab] = useState([])

  const ClusterMarker = ({ longitude, latitude, pointCount }) => (
    <Marker longitude={longitude} latitude={latitude}>
      <div style={{ ...style, background: 'orange' }}>{pointCount}</div>
    </Marker>
  );

  //terms taxonomy partners
  let partitems = [{value:'', label:'Tous'}]
  let themaitems = [{value:'', label:'Tous'}] //thematiques partenaires
  let realitems = [] // type de realisations projet
  //let urlpartner = base+'/api/taxonomy_term/cateegorie_partenaire';
  let urlpartner = urlbase + 'api/taxonomy_term/cateegorie_partenaire';
  //console.log("urlpartner", urlpartner)
  const {data:partners, isPendingpartners, errorpartners} = useFetch(urlpartner);
  //console.log("partners:", partners);
  if(partners){
      partners.data.map((partner) => (
          partitems.push({ value : partner.attributes.drupal_internal__tid, label: partner.attributes.name})
      ));
  }

  //terms taxonomy realisations projets
  let urltypereal = urlbase + 'api/taxonomy_term/realisation';
  //console.log("urltypereal", urltypereal)
  const {data:typereals, isPendingtypereals, errortypereals} = useFetch(urltypereal);
  //console.log("typereals:", typereals);
  if(typereals){
      typereals.data.map((typereal) => (
          realitems.push({ value : typereal.attributes.drupal_internal__tid, label: typereal.attributes.name})
      ));
  }

  //terms taxonomy thematiques partners
  let urlthema = urlbase + 'api/taxonomy_term/thematique';
  //console.log("urlthema", urlthema)
  const {data:themas, isPendingthemas, errorthemas} = useFetch(urlthema);
  //console.log("themas:", themas);
  if(themas){
      themas.data.map((thema) => (
          themaitems.push({ value : thema.attributes.drupal_internal__tid, label: thema.attributes.name})
      ));
  }
  
  const [name, setName] = useState('');
  const [selectedOption, setselectedOption] = useState('');
  const [selectedOptionTypeReal, setselectedOptionTypeReal] = useState(null);
  const [selectedOptionThema, setselectedOptionThema] = useState('');

  
  const [url, setUrl] = useState(urlbase_geolocations);

  // concat all strings value for each index found in the array
  const get_full_query = ((tab_query) => {
    //console.log('tab_query', tab_query)
    let tab_values =  []
    Object.keys(tab_query).forEach(function(index) {
      //console.log('value', tab_query[index])
      tab_values.push(tab_query[index])
    });
    //console.log(" aaaaaaaaaaaaaaaaaa", tab_values.join('&'))
    return tab_values.join('&');
  });

  //categories partners
  const handleChangeSelect = (selectedOption) => { 
      let tmp_url_full_query_tab = url_full_query_tab
      tmp_url_full_query_tab['categ_partner'] = null;
      if (selectedOption.value)
        tmp_url_full_query_tab['categ_partner'] = "field_categorie_target_id=" + selectedOption.value;
      console.log("field_categorie_target_id", tmp_url_full_query_tab['categ_partner']);
     
      //new full url
      let full_url = urlbase_geolocations.concat('&', get_full_query(tmp_url_full_query_tab))
      setUrl(full_url);
      console.log("full_url", full_url)   
      seturl_full_query_tab(tmp_url_full_query_tab)
      setselectedOption(selectedOption);     
  };

  //thematique partenaire
  const handleChangeThema = (selectedOption) => { 
      let tmp_url_full_query_tab = url_full_query_tab
      tmp_url_full_query_tab['thema_partners'] = null;
      if (selectedOption.value)
        tmp_url_full_query_tab['thema_partners'] = "field_thematiques_target_id=" + selectedOption.value;
      //console.log("field_thematiques_target_id", tmp_url_full_query_tab['thema_partners']);
        
      //new full url
      let full_url = urlbase_geolocations.concat('&', get_full_query(tmp_url_full_query_tab))
      setUrl(full_url);
      console.log("full_url", full_url)
      seturl_full_query_tab(tmp_url_full_query_tab)
      setselectedOptionThema(selectedOption);
  };

  //type realisations projet
  const handleChangeTypeReal = (selectedOption) => { 
      //console.log("selected multi Option", selectedOption)
      let tmp_url_full_query_tab = url_full_query_tab
      tmp_url_full_query_tab['typereal'] = null;
      let joinquery = []
      if (selectedOption.length)
      {
        let joinquery = selectedOption.map( (elt, index) => {
        //console.log("selected multi Option elt", elt)
        return `field_type_realisation_target_id\[`+index + `\]=`+elt.value;
       });
       //console.log("selected multi Option elt", joinquery);
       tmp_url_full_query_tab['typereal'] = joinquery.join('&');
       //setselectedOptionTypeReal(selected);  
      }  
      //console.log("url typereal", tmp_url_full_query_tab) 

      //new full url
      let full_url = urlbase_geolocations.concat('&', get_full_query(tmp_url_full_query_tab))
      setUrl(full_url);
      seturl_full_query_tab(tmp_url_full_query_tab)
      console.log("full_url", full_url) 
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

  //get all title values (from partners or from projet)
  let title_items = []

  const [global_title_items, setglobal_title_items] = useState([]) //in order to store the global array of titles (from partner and project)

  const handleOnSearch = (string, results) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    console.log(string, results)
  }

  const handleOnHover = (result) => {
    // the item hovered
    console.log(result)
  }

  //after choosing a title of partner or project from the autocompletion search box
  const handleOnSelect = (keyword) => {
    // the keyword selected
    //console.log("handleOnSelect keyword", keyword)

    //setName(keyword);
    let tmp_url_full_query_tab = url_full_query_tab
    tmp_url_full_query_tab['keyword_search'] = null;
    if (keyword && keyword.name) {
      tmp_url_full_query_tab['keyword_search'] = "combined_field_title=" + encodeURIComponent(keyword.name)
      console.log("combined_field_title", tmp_url_full_query_tab['keyword_search']);
        
      //new full url
      let full_url = urlbase_geolocations.concat('&', get_full_query(tmp_url_full_query_tab))
      setUrl(full_url);
      console.log("full_url", full_url)
      seturl_full_query_tab(tmp_url_full_query_tab)
      //setselectedOptionThema(selectedOption);
    }
  }

  const handleOnFocus = () => {
    console.log('Focused')
  }

  const formatResult = (item) => {
    return item;
   // return (<p dangerouslySetInnerHTML={{__html: '<strong>'+item+'</strong>'}}></p>); //To format result as html
  }

  // all geolocations
  var glocations_restruct = [];
  var glocations_restruct_no_duplicate_id = []; //avoid duplicata
  const [gLocations, setGLocations] = useState([]);
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(
        (result) => {
          //console.log("new url for looping", url);
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

                  //to get after also all titles(from partner or project) for an eventual likely autocomplete search
                  title_items.push({id: point.projet_id, name: point.projet_title})
                  //console.log("title_items", title_items);

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

                  //to get after also all titles(from partner or project) for an eventual likely autocomplete search
                  title_items.push({id: point.partenaire_id, name: point.partenaire_title})
                  //console.log("title_items", title_items);

                  glocations_restruct_no_duplicate_id.push(point.partenaire_id);
              }
                              
            }
          );

          setGLocations(glocations_restruct);
          console.log("gLocations.length", glocations_restruct);

          if (!global_title_items.length && title_items.length){
            setglobal_title_items(title_items) 
            console.log('global_title_items', global_title_items)
          }
          else
            console.log('hhhhhhhhhhhhh', global_title_items)
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
                <div className="App">
                  <header className="App-header">
                    <div style={{ width: 400 }}>
                      <ReactSearchAutocomplete
                        items={global_title_items}
                        fuseOptions={{
                          shouldSort: true,
                          threshold: 0,
                          location: 0,
                          distance: 100,
                          maxPatternLength: 32,
                          minMatchCharLength: 2,
                          keys: [
                            "name",
                            "id",
                          ],
                        }}
                        onSearch={handleOnSearch}
                        onHover={handleOnHover}
                        onSelect={handleOnSelect}
                        onFocus={handleOnFocus}
                        autoFocus
                        formatResult={formatResult}
                        placeholder="Saisir au moins 2 lettres"
                      />
                    </div>
                  </header>
                </div>       
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