import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import useQuery from "./hooks/useQuery";
import axios from "axios";
import { TailSpin } from "@agney/react-loading";
import Moment from "react-moment";
import AccountButton from "./AccountButton";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import RegionDialog from "./RegionDialog";
import { useRouter } from "next/router";
import wc from "which-country";
import $, { map } from "jquery";
import { toast } from "react-toastify";
import { useClipboard } from "@mantine/hooks";
import { LoadingOverlay } from "@mantine/core";
import { BiMapPin } from "react-icons/bi";
import {SpotlightProvider, useSpotlight} from "@mantine/spotlight";
import searchInOSM from "./util/SearchEngine";
import {AiOutlineSearch} from "react-icons/ai";
import {Box, Button, Loader} from "@mantine/core";
import generate3DLayer from "./util/generate3DLayer";

import ReactDOM from "react-dom";
import { getSession } from "next-auth/react";

import MapboxDraw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw-unminified";
//import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "mapbox-gl-style-switcher/styles.css";
import { MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import { centerOfMass, polygon } from "@turf/turf";

const Map = props => {
  mapboxgl.accessToken = "pk.eyJ1IjoibmFjaHdhaGwiLCJhIjoiY2tta3ZkdXJ2MDAwbzJ1cXN3ejM5N3NkcyJ9.t2yFHFQzb2PAHvPHF16sFw";

  const router = useRouter();
  const queryRouter = router?.query;
  console.log(queryRouter)
  const countries = queryRouter?.countries?.split(",");
  const query = useQuery();
  const israel = countries?.map((e) => e.toLowerCase()).includes("isr")
  console.log(countries);

  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [draw, setDraw] = useState(null)
  const [lng, setLng] = useState(israel? 35.03787026841233: 74.95817856138174);
  const [lat, setLat] = useState(israel? 31.892573864284234: 36.9073447365724);
  const [zoom, setZoom] = useState(israel? 6.75: 2.5);
  const [regionsUnused, setRegionsUnused] = useState({})
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
  const clipboard = useClipboard();
  const [actions, setActions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerMarkers, setPlayerMarkers] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [updateMap, setUpdateMap] = useState(false);

  const [edit, setEdit] = useState({});
  const [editID, setEditID] = useState(null);
  const [gEdit, setGEdit] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState(null);
  const [username, setUsername] = useState({ name: null, uuid: null });
  const [session, setSession] = useState(null);
  const [reRender, setReRender] = useState({});

  
  
  const renderOverlay = queryRouter?.overlay === "false" ? false : true;

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  const styles = [
   {
      title: "Dark",
     uri: "mapbox://styles/nachwahl/cl2nl1qes00bn14ksw5y85arm",
    },
    {
      title: "Light",
      uri: "mapbox://styles/mapbox/light-v9",
    },
    { title: "Outdoors", uri: "mapbox://styles/mapbox/outdoors-v11" },
    { title: "Satellite", uri: "mapbox://styles/mapbox/satellite-streets-v11" },
    { title: "Streets", uri: "mapbox://styles/mapbox/streets-v11" },
  ];

  const [showSearchLoading, setShowSearchLoading] = useState(false);

  const contextFunc = (e) => {
      
    console.log(JSON.stringify(e.features[0]))
    console.log(username)
    if (
      (username.name === e.features[0].properties.username ||
        username.uuid === e.features[0].properties.userUuid)
    ) {
        e.originalEvent.stopPropagation()
        e.originalEvent.preventDefault()
        const tProps = JSON.parse(JSON.stringify(e.features[0]))
        tProps.id = e.features[0].properties.id
        draw.add(tProps)
        draw.changeMode("direct_select", {featureId: e.features[0].properties.id})
        setEdit({...edit, [e.features[0].properties.id]: true})
        setGEdit(true)
        setEditID(e.features[0].properties.id)
        console.log("clicked")
    }

  }

  useEffect(() => {
    if (username.name || username.uuid) {
      if (map ) {
        map.off("contextmenu", "regions-layer", contextFunc)
        map.on("contextmenu", "regions-layer", contextFunc);
      }
      return console.log(username)
    }
    getSession().then((session) => {
      console.log(session)
      
      if (session?.user?.email)
        axios
          .post("/api/userinfo/", { email: session.user.email })
          .then((result) => {
            setUsername({ name: username.name, uuid: result.uuid || null });
          })
          .catch((err) => {
            alert("An error occurred! " + err.message);
          });
      if (session?.user?.name) {
        console.log(session.user.name)
        setUsername({ name: session.user.name, uuid: username.uuid });
        console.log(username)
      }
      setSession(session);
    });
  }, [username, map])

  useEffect(() => {
    if (map) return; // initialize map only once
    class HidePlayerControl {
      
      onAdd(map) {
        this.hidePlayers = renderOverlay;
        this.map = map;
        this.container = document.createElement("div");
        this.container.classList.add("mapboxgl-ctrl");
        this.container.classList.add("mapboxgl-ctrl-group");
        this.playerButton = document.createElement("button");
        this.playerButton.type = "button";
        this.playerButton.classList.add("mapboxgl-ctrl-player-icon");
        this.playerButton.style.backgroundImage =
          "url(\"background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-users'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E\");\")";
        this.container.appendChild(this.playerButton);
        this.playerButton.addEventListener("click", () => {
          if (hidePlayers) {
            console.log(hidePlayers);
            document.documentElement.style.setProperty("--marker-display", 1);
            hidePlayers = false;
          } else {
            document.documentElement.style.setProperty("--marker-display", 0);
            hidePlayers = true;
          }
        });
        return this.container;
      }

      onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
      }
    }

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/nachwahl/cl2nl1qes00bn14ksw5y85arm",
      center: [lng, lat],
      zoom: zoom,
    });
    if (renderOverlay) {
      console.log("e")
      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-left");
      mapInstance.addControl(
        new MapboxStyleSwitcherControl(styles, { defaultStyle: "Dark" }), "top-left"
      );
      mapInstance.addControl(new HidePlayerControl(), "top-left");
      var Draw = new MapboxDraw();

      // Map#addControl takes an optional second argument to set the position of the control.
      // If no position is specified the control defaults to `top-right`. See the docs
      // for more details: https://docs.mapbox.com/mapbox-gl-js/api/#map#addcontrol

      mapInstance.addControl(Draw, 'top-left');
      
      setDraw(Draw)
    }
    setMap(mapInstance);

    mapInstance.on('style.load', () => {
      let buildings = [];

      axios.get("/api/interactiveBuildings/all").then(({data}) => {

          data.forEach((building) => {
              let b = generate3DLayer(building.id, JSON.parse(building.origin), building.altitude, JSON.parse(building.rotate), building.fileURL, mapInstance)
              mapInstance.addLayer(b, 'waterway-label');
          })


      })
    });

    let buildings = [];

    //axios.get("/api/v1/interactiveBuildings/all").then(({data}) => {

    //    data.forEach((building) => {
    //        let b = generate3DLayer(building.id, JSON.parse(building.origin), building.altitude, JSON.parse(building.rotate), building.fileURL, mapInstance)
    //        mapInstance.addLayer(b, 'waterway-label');
    //    })

    //})

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });
  });

  useEffect(() => {
    if (!map) return;
    if (!updateMap) return;
    updateRegions();
  }, [updateMap]);

  const updateRegions = async () => {
    let regions = await axios.get("/api/exports/geojsonPoint");
    map.getSource("regions").setData(regions.data);
    setUpdateMap(false);
  };

  useEffect(() => {
    if (map) {
      map.on("load", () => {
        addLayer().then(() => testQuery());
      });
    }
  }, [map]);

  useEffect(() => {
    testQuery();
  }, [query]);

  const testQuery = async () => {
    if (query.get("region")) {
      let regionId = query.get("region");
      const uuidRegexExp =
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
      if (uuidRegexExp.test(regionId)) {
        axios.get(`/api/region/${regionId}`).then((region) => {
          let coords = JSON.parse(region.data.data);
          coords.push(coords[0]);
          let poly = polygon([coords]);
          let centerMass = centerOfMass(poly);
          changeLatLon(
            centerMass.geometry.coordinates[0],
            centerMass.geometry.coordinates[1]
          );
          if (query.get("details") === "true") {
            openDialog({
              id: regionId,
              userUuid: region.data.userUUID,
              username: region.data.username,
            });
          }
        });
      } else {
        console.error(
          "string in region query is not a valid uuid. maybe a directory climbing attack?"
        );
      }
    }
  };

  const handleQueryChange = (query) => {
    if (!query) {
        setActions([])
    }

    const regexForCoords = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
    if (regexForCoords.test(query)) {
        let coords = query.replace(" ", "").split(",");
        setActions([
            {
                title: 'Go to coordinates',
                description: query,
                onTrigger: () => changeLatLon(coords[0], coords[1]),
                icon: <BiMapPin size={18}/>,
            },
        ])
        return;
    }

    setShowSearchLoading(true);
    searchInOSM(query, changeLatLon).then(r => {
        setActions(r);
        setShowSearchLoading(false);
    })

}

  

  const addLayer = async () => {
    let regions = await axios.get("/api/exports/geojsonPoint");
    console.log(regions.data)
    setShowLoadingOverlay(false);
    map.addSource("regions", {
      type: "geojson",
      data: regions.data,
      tolerance: 0,
      generateId: true
    });

    console.log("ef")
    map.addLayer({
      id: "regions-layer",
      type: "fill",
      source: "regions",
      paint: {
        "fill-color": [
          "match",
          ["get", "regionType"],
          "normal",
          "rgba(3,80,203,0.37)",
          "event",
          "rgba(225,4,4,0.37)",
          "plot",
          "rgba(30,203,3,0.37)",
          /* other */ "rgba(3,80,203,0.37)",
        ],
      }
    });

    map.addLayer({
      id: "outline",
      type: "line",
      source: "regions",
      layout: {},

      paint: {
        "line-color": [
          "match",
          ["get", "regionType"],
          "normal",
          "rgb(0,90,229)",
          "event",
          "rgb(149,5,5)",
          "plot",
          "rgb(25,118,2)",
          /* other */ "rgb(0,90,229)",
        ],
        "line-width": 3,
      },
      
    });

    map.on("click", "regions-layer", (e) => {
      openDialog(e.features[0].properties.id);
    });

    map.on("mouseenter", "regions-layer", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "regions-layer", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("idle", () => {
      console.log("eeee")
      map.resize()
    })

    map.on("contextmenu", (e) => {
      if (gEdit) return
      clipboard.copy(e.lngLat.lat + ", " + e.lngLat.lng);
      toast.dark(`✅ Copied successfully`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    })

    $('#map-div').show();

    map.resize()
    console.log(map.getCanvas().toDataURL())
    console.log(map.getCanvasContainer())
  };

  

  const changeLatLon = (lat, lon) => {
    map.flyTo({
      center: [lon, lat],
      zoom: 16,
      essential: true,
    });
  };

  function saveEdit() {
    if (reRender[editID] !== null && draw.get(editID) !== undefined) {
      
      console.log(draw.get(editID));
      console.log(draw.getSelected())
      const remapReRender = draw.get(editID).geometry.coordinates[0].map((e) => [e[1], e[0]])
      console.log(remapReRender)
      const coordsStr =
        `[${remapReRender.map((f) => `[${f[0]}, ${f[1]}]`).join(", ")}]`;
      console.log(coordsStr);
      axios
        .post(`/api/region/changeData/${editID}`, { data: coordsStr })
        .then(() => {
          updateRegions()
          toast.dark(`✅ Edited region id ${editID}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        })
        .catch((err) => {
          alert("An error occurred! " + err.message);
        });
    }
    setEdit({});
    setGEdit(false);
    draw.deleteAll()

    const newreRender = reRender;
    delete newreRender[editID];
    setReRender(newreRender);
    setEditID(null);
    
  }

  function cancelEdit() {
    setEdit({});
    setGEdit(false);
    const tempReRender = reRender;
    delete tempReRender[editID];
    setReRender(editID);
    setEditID(null);
    draw.deleteAll()
  }



  const openDialog = (uid) => {
    setDialogData(uid);
    setDialogOpen(true);
  };

  const updateData = () => {
   axios
      .get("/api/data/")
      .then((result) => {
        setRegionsUnused(result.data);
     })
    .catch((err) => {
     alert("An error occurred! " + err.message);
  });
  };
  if (document.getElementsByClassName("leaflet-control-layers")[0])
    document.getElementsByClassName(
      "leaflet-control-layers"
    )[0].style.visibility = renderOverlay ? "visible" : "hidden";
  return (
    <SpotlightProvider shortcut={['mod + S']} actions={actions} onQueryChange={handleQueryChange}
    searchIcon={showSearchLoading ? <Loader size={"xs"}/> : <AiOutlineSearch/>}
    filter={(query, actions) => actions}>
    <div>
      <AnimatePresence>
        {dialogOpen && (
          <div>
            <motion.div
              className="absolute top-0 left-0 h-screen w-screen"
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(6px)" }}
              exit={{ backdropFilter: "blur(0px)" }}
              style={{ zIndex: "4000" }}
              onClick={() => setDialogOpen(false)}
            />
            <div className="absolute top-0 left-0 h-screen w-screen flex items-center justify-center">
              <motion.div
                className="bg-white rounded-lg w-1/3 h-auto transition"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ ease: "easeOut", duration: 0.15 }}
                style={{ originX: 0.5, originY: 0.5, zIndex: "5000" }}
              >
                <span
                  onClick={() => setDialogOpen(false)}
                  className="float-right m-3 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="feather feather-x"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
                <RegionDialog
                  uid={dialogData}
                  setDialogOpen={setDialogOpen}
                  updateData={updateData}
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {gEdit && (
        <div
          className="absolute top-0 text-white p-4 flex justify-center items-center"
          style={{ zIndex: "1000", right: "40%" }}
        >
          <a href="#" onClick={cancelEdit}>
            <button
              type="button"
              class="inline-block px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              Cancel Edit
            </button>
          </a>

          <div
            style={{
              width: "10px",
              height: "auto",
              display: "inline-block",
            }}
          />

          <a href="#" onClick={saveEdit}>
            <button
              type="button"
              class="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              &nbsp;&nbsp;&nbsp;Save Edit&nbsp;&nbsp;
            </button>
          </a>
        </div>
      )}

      <a href="#" onClick={() => {}}>
        {renderOverlay && (
          <div
            className="absolute top-0 right-0 text-white p-4 flex justify-center items-center"
            style={{ zIndex: "999" }}
          >
            <AccountButton />
            <div className="opacity-50 hover:opacity-100 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-refresh-cw"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </div>
            <Link href="/stats">
              <div className="opacity-50 hover:opacity-100 transition ml-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="feather feather-bar-chart-2"
                >
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
            </Link>
            <a href="https://discord.gg/eBhAEPgV6K">
              <img src="/logoanimated.gif" width="24" alt="" className="ml-2" />
            </a>
          </div>
        )}
      </a>
      <div style={{ width: "100%", position: "relative", flex: 1 }}>
        <LoadingOverlay visible={showLoadingOverlay} />
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }}/>
      </div>
      {/* 
        {regions?.map((region) => {
          let pane = (
            <FeatureGroup>
              {(username.name === region.username ||
                username.uuid === region.useruuid) &&
                renderOverlay &&
                edit[region.uid] && (
                  <EditControl
                    position={'topleft'}
                    draw=
                    {{
                      rectangle: false,
                      circle: false,
                      circlemarker: false,
                      marker: false,
                      polygon: false,
                      polyline: false,
                    }}
                    edit=
                    {{
                        polygon: true,
                        remove: false
                    }}
                    onEditVertex={(e) => {
                        const tempData = JSON.parse(region.data)
                        for (const thisLayer in e.target._layers) {
                            if (e.target._layers.hasOwnProperty(thisLayer)) {
                                if (e.target._layers[thisLayer].hasOwnProperty("edited")) {
                                    const newPolyLatLngArray = e.target._layers[thisLayer].editing.latlngs[0];
                                    setReRender({...reRender, [region.uid]: newPolyLatLngArray[0]})
                                }
                            }
                        }
                    }}
                  />
                )}
              <Polygon
                pathOptions={
                  region.useruuid !== "EVENT"
                    ? { fillColor: "blue" }
                    : { color: "red", fillColor: "red" }
                }
                positions={reRender[region.uid] || JSON.parse(region.data)}
                key={`${region.uid} - ${Object.keys(reRender[region.uid] || {})}`}
                eventHandlers={{
                  click: () => {if (!edit[region.uid]) openDialog(region.uid)},
                  mousedown: (event) => {
                    if (edit[region.uid] && event.originalEvent.button === 2) return
                    if (
                      (username.name === region.username ||
                        username.uuid === region.useruuid) && event.originalEvent.button === 2
                    ) {
                        event.originalEvent.stopPropagation()
                        event.originalEvent.preventDefault()
                        setEdit({...edit, [region.uid]: true})
                        setGEdit(true)
                        setEditID(region.uid)
                        setTimeout(() => {
                            const click = document.getElementsByClassName("leaflet-draw-edit-edit")
                            console.log(click.length)
                            console.log(click.item(0))
                            console.log(click)
                            click.item(0).click()
                        }, 0)
                        
                    }
                      
                  },
                  mouseup: (event) => {
                    if (
                        (username.name === region.username ||
                          username.uuid === region.useruuid) && event.originalEvent.button === 2
                      ) {
                          event.originalEvent.stopPropagation()
                          event.originalEvent.preventDefault()
                      }
                  }
                }}
              >
                {!gEdit && (<Tooltip style={{ width: "100%" }} sticky>
                  <div>
                    <img
                      src={
                        region.useruuid !== "EVENT"
                          ? `https://minotar.net/helm/${region.username
                              .replaceAll(/n\/a/gi, "IHG_Steve")
                              .replaceAll(/([*])/g, "")}` 
                          : "/logo.png"
                      }
                      className="w-1/2 h-1/2"
                      alt=""
                    />
                    <div className="mt-3">
                      <b>{region.username}</b>
                      <p className="m-0">{region.city}</p>
                      <p className="m-0">{region.count} buildings</p>
                      <p className="text-gray-300 italic text-xs m-0">
                        <Moment date={region.createdDate} format="DD.MM.YYYY" />
                      </p>
                    </div>
                    {(username.name === region.username ||
                      username.uuid === region.useruuid) && (
                      <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded items-center inline-flex"
                      >
                        <svg
                          class="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>Right click to Edit</span>
                      </button>
                    )}
                  </div>
                </Tooltip>)}
              </Polygon>
            </FeatureGroup>
          );

          if (countries) {
            if (
              countries.includes(
                wc(JSON.parse(region.data)[0].reverse())?.toLowerCase()
              )
            )
              return pane;
          } else {
            return pane;
          }
        })}
        */}
    </div>
    </SpotlightProvider>
  );
};

export default Map;
