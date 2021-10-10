import { GoogleMap, InfoWindow, Marker, useLoadScript } from "@react-google-maps/api";
import { useCallback, useRef, useState } from "react";
import { formatRelative } from "date-fns";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete"
import {
    Combobox,
    ComboboxInput,
    ComboboxPopover,
    ComboboxList,
    ComboboxOption
} from "@reach/combobox";

const libraries = ["places"];
const mapContainerStyle = {
    with: '100vw',
    height: '100vh',
};
const center = {
    lat: -23.5592114,
    lng: -46.9075753,
}

function Map() {

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: 'AIzaSyAY_i6KSI1lOUAXRfEIxMtQ2TGoLtYzfVI',
        libraries,
    });

    const [makers, setMarkers] = useState([]);
    const [selected, setSelected] = useState(null);

    const onMapClick = useCallback((e) => {
        setMarkers((current) => [...current,
        {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
            time: new Date(),
        }]);
    }, []);

    const mapRef = useRef();
    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const panTo = useCallback(({ lat, lng }) => {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(14)
    }, [])

    if (loadError) return "Erro ao fazer loading";
    if (!isLoaded) return "Carregando mapa";


    return (
        <div>
            <h1>FindPet <span>🐱</span></h1>

            <Search panTo={panTo} />
            <Locate panTo={panTo}/>

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={8}
                center={center}
                onClick={onMapClick}
                onLoad={onMapLoad}
            >
                {makers.map((marker) =>
                (
                    <Marker
                        position={{ lat: marker.lat, lng: marker.lng }}
                        onClick={() => {
                            setSelected(marker)
                        }}
                    />
                ))}

                {selected ? (<InfoWindow onCloseClick={() => {
                    setSelected(null)
                }} position={{ lat: selected.lat, lng: selected.lng }}>
                    <div>
                        <h2>spotted:</h2>
                        <p>spotted {formatRelative(selected.time, new Date())}</p>
                    </div>
                </InfoWindow>) : null}
            </GoogleMap>
        </div>
    );
}

function Locate({ panTo }) {
    return (
        <button onClick={() => {
            navigator.geolocation.getCurrentPosition(
                (possition) => {
                    panTo({
                        lat: possition.coords.latitude,
                        lng: possition.coords.longitude,
                    })
                }, 
                () => null)
        }}>
            <p>🕐</p>
        </button>
    )
}

function Search({ panTo }) {
    const { ready, value, suggestions: { status, data }, setValue, clearSuggestions } = usePlacesAutocomplete({
        requestOptions: {
            location: {
                lat: () => -23.5592114,
                lng: () => -46.9075753,
            },
            radius: 200 * 1000,
        }
    });

    return <Combobox
        onSelect={async (address) => {
            setValue(address, false);
            clearSuggestions()

            try {
                const resultado = await getGeocode({ address });
                const { lat, lng } = await getLatLng(resultado[0]);
                panTo({ lat, lng })
            } catch (error) {
                console.log("erro");
            }
        }}>
        <ComboboxInput value={value} onChange={(e) => {
            setValue(e.target.value)
        }}
            disabled={!ready}
            placeholder="address"
        />
        <ComboboxPopover>
            <ComboboxList>
                {status === "OK" && data.map(({ id, description }) => <ComboboxOption value={description} />)}
            </ComboboxList>
        </ComboboxPopover>
    </Combobox>
}

export default Map;