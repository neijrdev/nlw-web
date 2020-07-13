import React, {useEffect, useState, ChangeEvent, FormEvent}  from 'react';
import {Link, useHistory} from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import {LeafletMouseEvent} from 'leaflet'
import './style.css';
import logo from '../../assets/logo.svg';
import api from './../../services/api';
import axios from 'axios'

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface UFIBGEResponse {
  sigla: string;
}

interface CityIBGEResponse {
  nome: string;
}



const CreatePoint = ()=>{
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [selectedUf, setSelectedUf] = useState("0")
  const [citysUf, setCitysUf] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState("0")
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])
  const [selectPosition, setSelectPosition] = useState<[number, number]>([0,0])
  const [selectItems, setSelectItems] = useState<number[]>([])
  const history = useHistory()
  const [formData, setFormData] = useState({
    name:'',
    email:'',
    whatsapp:''
  })
  
  useEffect(()=>{
   navigator.geolocation.getCurrentPosition(position=>{
     const {latitude, longitude} = position.coords
     setInitialPosition([latitude,longitude])
   })
  }
  ,[])

  useEffect(()=>{
    api.get('items')
    .then(response=>{
      setItems(response.data);
    })
  }
  ,[])

  useEffect(()=>{
    axios.get<UFIBGEResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
    .then(response=>{
      setUfs(response.data.map(uf=>uf.sigla));
    })
  }
  ,[])

  useEffect(()=>{
    if(selectedUf!=="0"){
      console.log("buscando citys po UF...")
      axios.get<CityIBGEResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(response=>{
      setCitysUf(response.data.map(citys=>citys.nome));
    })
    }
  },[selectedUf])

  function handleSelectUf(event:ChangeEvent<HTMLSelectElement>){
    const uf = (event.target.value)
    setSelectedUf(uf)
  }


  function handleSelectCity(event:ChangeEvent<HTMLSelectElement>){
    const city = (event.target.value)
    setSelectedCity(city)
  }

  function handleMapClick(event:LeafletMouseEvent){
    setSelectPosition([event.latlng.lat,event.latlng.lng])
  }

  function handleInputChange(event:ChangeEvent<HTMLInputElement>){
    const {name, value} = event.target

    setFormData({...formData,[name]:value})
  }

  function handleSelectItem (id:number){
    const alreadySelected = selectItems.findIndex(item_id=> item_id === id)

    if(alreadySelected >=0){
      const filteredItems = selectItems.filter(item_id => item_id !== id)
      setSelectItems(filteredItems)
    } else {
      setSelectItems([...selectItems,id])
    }
  }

  async function handleSubmit (event:FormEvent){
    event.preventDefault();
    const {name, email, whatsapp} = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectPosition;
    const items = selectItems;

    const data = {
      name,
      email,
      whatsapp,
      uf,
      city,
      latitude,
      longitude,
      items
    }

    await api.post('points', data)

    console.log("Cadastro Concluido")


    history.push('/')





  }


  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>
        <Link to="/">
          <FiArrowLeft/>
          voltar para a home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br/> Ponto de Coleta </h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da Entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
              required
            />
          </div>


          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
                required
              />
            </div>

          </div>

        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectPosition}>
              <Popup>
                Meu Endereço aqui.
              </Popup>
            </Marker>

          </Map>
   

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select name="uf" id="uf"
                value= {selectedUf}
                onChange={handleSelectUf}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf=>(
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value= {selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma Cidade</option>
                {citysUf.map(city=>(
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

          </div>

        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítems de coleta</h2>
            <span>Selecione uns ou mais ítems abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item=>(
              <li
                key={item.id}
                onClick={()=>handleSelectItem(item.id)}
                className={selectItems.includes(item.id)?"selected":""}
              >
                <img src={item.image_url} alt={item.title}/>
                <span>{item.title}</span>
              </li>
            ))}

          </ul>

        </fieldset>
        <button type="submit">
          Cadastrar Ponto de Coleta
        </button>

      </form>
    </div>

  )

}

export default CreatePoint;
