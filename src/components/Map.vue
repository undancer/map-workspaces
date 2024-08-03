<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import qs from 'qs'

const router = useRouter()

const mapContainerRef = ref<HTMLElement>()
const myMapRef = ref<L.Map>()

import mapConfig from '@/assets/map-config.json'

function createMap() {
  const [originX, originY] = mapConfig.origin

  const { center, zoom } = qs.parse(window.location.hash, {
    ignoreQueryPrefix: true
  })

  const mapCRS = L.Util.extend({}, L.CRS.Simple, {
    projection: {
      project(latlng: L.LatLng) {
        return new L.Point(latlng.lng + originX, latlng.lat + originY)
      },
      unproject(point: L.Point) {
        return new L.LatLng(point.y - originY, point.x - originX)
      }
    },
    transformation: new L.Transformation(1, 0, 1, 0),
    infinite: true
  })

  if (!mapContainerRef?.value) {
    return
  }

  const myMap = L.map(mapContainerRef.value, {
    // Control options
    attributionControl: false,
    zoomControl: false,
    // Interaction Options
    doubleClickZoom: false,
    zoomSnap: 0.5,
    maxBoundsViscosity: 1.0,
    // Map State Options
    crs: mapCRS,
    center: center
      ? ((center as string).split(',').map((v) => {
          return parseFloat(v)
        }) as L.LatLngTuple)
      : [0, 0],
    zoom: zoom ? Number(zoom) : -2,
    minZoom: -3, // mapZoomLevel 配置
    maxZoom: 2.5, // mapZoomLevel 配置
    // Animation Options
    zoomAnimation: false,
    fadeAnimation: false
  })

  myMapRef.value = myMap

  const tileLayer = initTileLayer(mapCRS)
  myMap.addLayer(tileLayer)

  const debugCoordsLayer: L.Layer = initDebugCoordsLayer()
  myMap.addLayer(debugCoordsLayer)

  myMap.on('moveend', () => {
    const mapCenter = myMap.getCenter()
    router.replace({
      query: {
        center: mapCenter.lat.toFixed(2) + ',' + mapCenter.lng.toFixed(2),
        zoom: myMap.getZoom().toFixed(2)
      }
    })
  })
}

function initDebugCoordsLayer() {
  const DebugCoordsLayer = L.GridLayer.extend({
    createTile: function (coords: L.Coords) {
      const tile = document.createElement('div')
      tile.innerText = [coords.x, coords.y, coords.z].join(', ')
      tile.classList.add(
        'flex',
        'items-center',
        'justify-center',
        'outline',
        'outline-1',
        'outline-red-600'
      )

      return tile
    }
  })

  return new DebugCoordsLayer()
}

function initTileLayer(crs: L.CRS): L.GridLayer {
  const [totalX, totalY] = mapConfig.total_size

  const bounds = L.latLngBounds(
    crs.unproject(new L.Point(0, 0)),
    crs.unproject(new L.Point(totalX, totalY))
  )

  // 横向/纵向 瓦片数量
  const xLen = mapConfig.slices[0].length
  const yLen = mapConfig.slices.length

  // 瓦片 x, y 长度
  const xSize = totalX / xLen
  const ySize = totalY / yLen

  class TileLayer extends L.GridLayer {
    createTile(coords: L.Coords) {
      const el = document.createElement('img')
      el.crossOrigin = 'anonymous'
      el.dataset.x = coords.x.toString()
      el.dataset.y = coords.y.toString()
      el.dataset.z = coords.z.toString()

      const processParams = []

      const tileSize = this.getTileSize()
      const tileSizeX = tileSize.x

      const zoom1 = 100 * Math.pow(2, coords.z)
      const zoom2 = Math.ceil(zoom1)
      const zoom3 = Math.round((tileSizeX * zoom2) / zoom1)
      processParams.push(['resize', 'p_' + zoom2])

      const cx1 = Math.floor((xSize * zoom2) / 100)
      const cx2 = coords.x * zoom3
      const cx3 = Math.round(cx2 % cx1)
      const xx = Math.floor(cx2 / cx1)
      const cy1 = Math.floor((ySize * zoom2) / 100)
      const cy2 = coords.y * zoom3
      const cy3 = Math.round(cy2 % cy1)
      const yy = Math.floor(cy2 / cy1)
      processParams.push(['crop', 'x_' + cx3, 'y_' + cy3, 'w_' + zoom3, 'h_' + zoom3])

      processParams.push(['format', 'webp'])

      const processParamsStr =
        '?x-oss-process=image/' +
        processParams
          .map((v) => {
            return v.join(',')
          })
          .join('/')
      const url = mapConfig.slices[yy][xx].url + processParamsStr
      el.src = url

      return el
    }
  }

  const opts: L.GridLayerOptions = {
    bounds: bounds,
    minZoom: -5,
    maxZoom: 2.5 + 0.5,
    maxNativeZoom: 0,
    minNativeZoom: -Math.min(Math.log2(xSize / 256), Math.log2(ySize / 256)),
    className: 'map-tile'
  }
  return new TileLayer(opts)
}

onMounted(() => {
  createMap()
})
</script>

<template>
  <div id="mapContainer" ref="mapContainerRef" class="h-screen"></div>
</template>
