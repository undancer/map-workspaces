import got from 'got'
import fs from 'node:fs'
import { pipeline as streamPipeline } from 'node:stream/promises'

[
    2, // 提瓦特大地图
    // 7, // 渊下宫
    // 9, // 层岩巨渊·地下矿区
    // 34, // 旧日之海
    // 35, // 希穆兰卡
].forEach(async (mapId) => {

    const data = await got.get('https://waf-api-takumi.mihoyo.com/common/map_user/ys_obc/v3/map/info', {
        searchParams: {
            app_sn: 'ys_obc',
            lang: 'zh-cn',
            map_id: mapId,
        }
    }).json()
    const info = (data as any).data.info
    const { id, name, detail_v2: { map_version, min_zoom, max_zoom, total_size: [width, height] } } = info
    const map_id = mapId

    // console.log(info)
    console.log(id, name, map_version, min_zoom, max_zoom, width, height)

    for (let z = max_zoom, index = 0; z >= min_zoom; z--, index++) { // zoom值，从最大值到最小值，可能有负数
        const zIndex = `${z < 0 ? 'N' : 'P'}${Math.abs(z)}`
        const [m, n] = [Math.ceil((width / 256) / Math.pow(2, index)), Math.ceil((height / 256) / Math.pow(2, index))]
        for (let x = 0; x < m; x++) {
            for (let y = 0; y < n; y++) {
                console.log(`env: ${mapId},${x},${y},${z},${index}`)
                console.log(`dir: ./public/map/tiles/${mapId}/${zIndex}`)
                console.log(`raw: ./public/map/tiles/${mapId}/${zIndex}/${x}_${y}_${zIndex}.webp`)
                console.log(`url: https://act-webstatic.mihoyo.com/ys-map-op/map/${map_id}/${map_version}/${x}_${y}_${zIndex}.webp`)
                console.log()

                const url = `https://act-webstatic.mihoyo.com/ys-map-op/map/${map_id}/${map_version}/${x}_${y}_${zIndex}.webp`
                const dir = `./public/map/tiles/${mapId}/${zIndex}`
                fs.mkdirSync(dir, { recursive: true })
                const out = fs.createWriteStream(`${dir}/${x}_${y}_${zIndex}.webp`)
                const stream = got.stream.get(url)
                console.log('url: ', url)

                try {
                    await streamPipeline(stream, out);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }
})
