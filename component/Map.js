import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Tooltip,
  LayersControl,
  withLeaflet,
  FeatureGroup,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet"

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
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
import "leaflet-draw/dist/leaflet.draw.css"
import { toast } from "react-toastify"

import ReactDOM from "react-dom";

import { getSession } from "next-auth/react";

function disable(val) {
  if (document.getElementsByClassName("leaflet-control-layers")[0])
    document.getElementsByClassName(
      "leaflet-control-layers"
    )[0].style.visibility = val ? "visible" : "hidden";
}

const Map = (props) => {
  const mapRef = useRef();
  const [regions, setRegions] = useState(null);
  const [edit, setEdit] = useState({});
  const [editID, setEditID] = useState(null);
  const [gEdit, setGEdit] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState(null);
  const [username, setUsername] = useState({ name: null, uuid: null });
  const [session, setSession] = useState(null);
  const [reRender, setReRender] = useState({})
  const router = useRouter();
  const query = router?.query;
  const renderOverlay = query.overlay === "false" ? false : true;
  const countries = query?.countries?.split(",");
  console.log(countries);
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  function saveEdit() {
    if (reRender[editID] !== undefined || reRender[editID] !== null) {
        console.log(reRender[editID])
        const remapReRender = reRender[editID].map((ele) => `[${ele.lat.toFixed(6)}, ${ele.lng.toFixed(6)}]`)
        const coordsStr= "[" + [...remapReRender, remapReRender[0]].join(", ") + "]"
        console.log(coordsStr)
        axios.post(`/api/region/changeData/${editID}`, {data: coordsStr}).then(() => {
            updateData()
            toast.dark(`✅ Edited region id ${editID}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }).catch((err) => {
            alert("An error occurred! " + err.message)
        })
        
    }
    setEdit({})
    setGEdit(false)
    
    setTimeout(() => {
        const click = document.getElementsByClassName("leaflet-draw-actions")
        // 1 is cancel 0 is save
        click.item(0).childNodes.item(0).childNodes.item(0).click()
        const newreRender = reRender
        delete newreRender[editID]
        setReRender(newreRender)
        setEditID(null)
    }, 0)
  }

  function cancelEdit() {
    setEdit({})
    setGEdit(false)
    const tempReRender = reRender;
    delete tempReRender[editID]
    setReRender(editID)
    setEditID(null)
    setTimeout(() => {
        const click = document.getElementsByClassName("leaflet-draw-actions")
        // 1 is cancel 0 is save
        click.item(0).childNodes.item(1).childNodes.item(0).click()
        updateData()
    }, 0)
  }

  useEffect(() => {
    axios
      .get("/api/data/")
      .then((result) => {
        setRegions(result.data);
      })
      .catch((err) => {
        alert("An error occurred! " + err.message);
      });
    getSession().then((session) => {
      setSession(session);
      if (session?.user?.email)
        axios
          .post("/api/userinfo/", { email: session.user.email })
          .then((result) => {
            setUsername({ name: username.name, uuid: result.uuid || null });
          })
          .catch((err) => {
            alert("An error occurred! " + err.message);
          });
      if (session?.user?.name)
        setUsername({ name: session.user.name, uuid: username.uuid });
    });
  }, []);

  const openDialog = (uid) => {
    setDialogData(uid);
    setDialogOpen(true);
  };

  const updateData = () => {
    axios
      .get("/api/data/")
      .then((result) => {
        setRegions(result.data);
      })
      .catch((err) => {
        alert("An error occurred! " + err.message);
      });
  };
  if (document.getElementsByClassName("leaflet-control-layers")[0])
    document.getElementsByClassName(
      "leaflet-control-layers"
    )[0].style.visibility = renderOverlay ? "visible" : "hidden";
  if (!regions)
    return (
      <div className="bg-gray-900 h-screen w-100 flex items-center justify-center">
        <TailSpin width="100" />
      </div>
    );
  return (
    <div>
      {/* {!renderOverlay && <style jsx global>{`.leaflet-control-layers { display: none; }`}  </style>} */}
      {!renderOverlay && <style jsx global>{`.leaflet-control-layers { display: none; }`}  </style>}
      {/*{<style jsx global>{`.leaflet-draw-toolbar { visibility: hidden; }`}  </style>} */}
      {<style jsx global>{`.leaflet-draw-toolbar { visibility: hidden;; }`}  </style>}
      {/*{<style jsx global>{`.leaflet-draw-actions { visibility: hidden; }`}  </style>} */}
      {<style jsx global>{`.leaflet-draw-actions  { visibility: hidden; }`}  </style>}
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
            style={{ zIndex: "1000", right: '40%'}}
          >
        <a href="#" onClick={cancelEdit}>
            <button type="button" class="inline-block px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out">Cancel Edit</button>
        </a>

        <div style={{
            width: '10px',
            height: 'auto',
            display: 'inline-block'
        }}/>
        
        <a href="#" onClick={saveEdit}>
            <button type="button" class="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">&nbsp;&nbsp;&nbsp;Save Edit&nbsp;&nbsp;</button>
        </a>
      </div>
      )}
      
      <a href="#" onClick={updateData}>
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
      <MapContainer
        center={
          props.zoomPosition
            ? props.zoomPosition
            : countries?.includes("isr")
            ? [31.7541495, 35.2258429]
            : [26.0494961, 72.0811977]
        }
        zoom={props.zoomPosition ? 17 : countries?.includes("isr") ? 8 : 4}
        scrollWheelZoom={true}
        zoomControl={renderOverlay ? true : false}
        style={{ height: "100vh", width: "100vw" }}
        ref={mapRef}
        preferCanvas={true}
        maxZoom={23}
      >
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Dark">
            <TileLayer
              attribution={`&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a> | <a href="https://github.com/Nachwahl/polymap">PolyMap</a> | Total regions: ${regions.length}`}
              url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
              maxZoom={23}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap Default">
            <TileLayer
              attribution={`&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors | <a href="https://github.com/Nachwahl/polymap">PolyMap</a> | Total regions: ${regions.length}`}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={23}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution={`&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://mapbox.com">Mapbox</a> | <a href="https://github.com/Nachwahl/polymap">PolyMap</a> | Total regions: ${regions.length}`}
              url="https://api.mapbox.com/styles/v1/nachwahl/ckmkvfkwg00ds17rwt7u4zlyi/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibmFjaHdhaGwiLCJhIjoiY2tta3ZkdXJ2MDAwbzJ1cXN3ejM5N3NkcyJ9.t2yFHFQzb2PAHvPHF16sFw"
              maxZoom={23}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Navigation">
            <TileLayer
              attribution={`&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://mapbox.com">Mapbox</a> | <a href="https://github.com/Nachwahl/polymap">PolyMap</a> | Total regions: ${regions.length}`}
              url="https://api.mapbox.com/styles/v1/nachwahl/ckmkvtwzd3l0617s6rmry2gm5/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibmFjaHdhaGwiLCJhIjoiY2tta3ZkdXJ2MDAwbzJ1cXN3ejM5N3NkcyJ9.t2yFHFQzb2PAHvPHF16sFw"
              maxZoom={23}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Base">
            <TileLayer
              attribution={`&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://mapbox.com">Mapbox</a> | <a href="https://github.com/Nachwahl/polymap">PolyMap</a> | Total regions: ${regions.length}`}
              url="https://api.mapbox.com/styles/v1/nachwahl/ckmkvx4vbeplx17qyfztyb6pk/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibmFjaHdhaGwiLCJhIjoiY2tta3ZkdXJ2MDAwbzJ1cXN3ejM5N3NkcyJ9.t2yFHFQzb2PAHvPHF16sFw"
              maxZoom={23}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

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
                              .replaceAll(/([*/])/g, "")}`
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
      </MapContainer>
    </div>
  );
};

export default Map;
