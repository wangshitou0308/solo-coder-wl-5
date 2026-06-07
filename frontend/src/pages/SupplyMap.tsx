import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useSupplyStore } from '@/store/supplyStore'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export function SupplyMap() {
  const { supplies, fetchSupplies, isLoading } = useSupplyStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchSupplies()
  }, [fetchSupplies])

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'food', label: '食品' },
    { value: 'water', label: '饮用水' },
    { value: 'medicine', label: '药品' },
    { value: 'clothing', label: '衣物' },
    { value: 'shelter', label: '避难物资' },
    { value: 'tools', label: '工具' },
    { value: 'first_aid', label: '急救用品' },
    { value: 'other', label: '其他' },
  ]

  const filteredSupplies = selectedCategory === 'all' 
    ? supplies 
    : supplies.filter(s => s.category === selectedCategory)

  const suppliesWithLocation = filteredSupplies.filter(s => s.lat && s.lng)

  const center: [number, number] = [39.9042, 116.4074]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">物资地图</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">分类筛选：</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-96 md:h-[600px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {suppliesWithLocation.map((supply) => (
                <Marker
                  key={supply.id}
                  position={[supply.lat!, supply.lng!]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-medium text-gray-900">{supply.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">数量：{supply.quantity} {supply.unit}</p>
                      <Link
                        to={`/supplies/${supply.id}`}
                        className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                      >
                        查看详情 →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">物资列表</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSupplies.slice(0, 6).map((supply) => (
            <Link
              key={supply.id}
              to={`/supplies/${supply.id}`}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <h4 className="font-medium text-gray-900">{supply.name}</h4>
              <p className="text-sm text-gray-500 mt-1">数量：{supply.quantity} {supply.unit}</p>
              <p className="text-sm text-gray-400 mt-1">{supply.location}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
