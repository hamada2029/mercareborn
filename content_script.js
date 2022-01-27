/* globals Photos */

(function() {

class ReSeller{
    constructor(){
        this.headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
            'authorization': null,
            'sec-ch-ua': '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'x-platform': 'web'
        };
        this.merbtn = document.createElement('mer-button');
        this.merbtn.id = 'merBtn1';
        this.btn = document.createElement('button');
        this.btn.innerText = '再出品';
        this.btn.id = 'myBtn1';
        this.merbtn.appendChild(this.btn);
        document.body.appendChild(this.merbtn);
    }

    obFunc(
        // mutationsList, observer
    ){
        // console.log(this);  // MutationObserver
        const _btn = document.getElementById('myBtn1');
        const m = location.href.match(/\/transaction\/(m\d+)/);
        if(! m){
            _btn.disabled = true;
            _btn.innerText = '再出品';
            _btn.style.display = 'none';
            _btn.style.opacity = '1';
            return;
        }
        const myId = m[1];
        const resolds = localStorage.getItem('resolds') || '';
        if(resolds.includes(myId)){
            _btn.disabled = true;
            _btn.innerText = '再出品済み';
            _btn.style.display = 'block';
            _btn.style.opacity = '0.5';
            return;
        }
        _btn.disabled = false;
        _btn.innerText = '再出品';
        _btn.style.display = 'block';
        _btn.style.opacity = '1';
    }

    main(){
        const observer = new MutationObserver(this.obFunc);
        observer.observe(
            document.body,
            {childList: true}
        );
        // #shadow--rootのDOMは取得できないの
        this.btn.addEventListener(
            'click',
            {
                headers: this.headers,
                handleEvent: ev => {
                    try{
                        this.clickFunc(ev);
                    }catch(err){
                        alert('エラーが発生しました。');
                        throw err;
                    }
                },
                generateRandomHexString:
                    this.generateRandomHexString
            },
            false
        );
    }

    generateRandomHexString(numBytes){
        const bytes= crypto.getRandomValues(new Uint8Array(numBytes));
        const array= Array.from(bytes);
        const hexPairs= array.map(b=> b.toString(16).padStart(2, '0'));
        return hexPairs.join('');
    }

    async clickFunc(ev){
        ev.target.disabled = true;
        ev.target.classList.add('opaopa');
        if (!localStorage.authTokenData) {
            alert('ログインしてください。');
            return;
        }

        //DPoPは決め打ちでいいのかも
        const authTokenData = JSON.parse(localStorage.authTokenData);
        console.log(`accessToken: ${authTokenData.accessToken}`);
        console.log(`location.href: ${location.href}`);
        const itemId = location.href.match(/transaction\/(m\d+)/)[1];
        this.headers.authorization = authTokenData.accessToken;
        let r = await fetch(
            'https://api.mercari.jp/items/get?id=' + itemId,
            {'headers': this.headers}
        );
        let j = await r.json();
        const soldData = j.data;
        console.log(soldData);
        const photos = new Photos(soldData.photos, this.headers);
        const photo_urls = await photos.get();
        let postData = {
            'category_id': soldData.item_category.id,
            'description': soldData.description,
            // 32文字
            'exhibit_token': this.generateRandomHexString(16),
            'item_condition': soldData.item_condition.id,
            'name': soldData.name,
            'price': soldData.price,
            'sales_fee': soldData.sales_fee.fee,
            'shipping_duration': soldData.shipping_duration.id,
            'shipping_from_area': soldData.shipping_from_area.id,
            'shipping_method': soldData.shipping_method.id,
            'shipping_payer': soldData.shipping_payer.id,
            'uploaded_by_photo_service': true
        };
        for(let i = 0; i < photo_urls.length; i++){
            let photoName = `photo_${i + 1}`;
            postData[photoName] = photo_urls[i];
        }
        console.log(postData);
        const fd = new FormData();
        for(let k in postData){
            fd.append(k, postData[k]);
        }
        // FormDataはconsole.logしてもイテレーターでみれない
        console.log(fd.getAll('price'));
        r = await fetch(
            'https://api.mercari.jp/sellers/sell',
            {
                'method': 'POST',
                'headers': this.headers,
                'body': fd
            }
        );
        j = await r.json();
        console.log(j);
        ev.target.disabled = false;
        ev.target.classList.remove('opaopa');
        let resolds = localStorage.getItem('resolds') || '';
        localStorage.setItem('resolds', `${resolds}|${itemId}`);
        location.href = 'https://jp.mercari.com/item/' + j.data.id;
    }


}


console.log('content script');
const rs = new ReSeller();
console.log(rs);
rs.main();



})();