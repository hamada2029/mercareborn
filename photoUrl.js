

// eslint-disable-next-line no-unused-vars
class Photos{
    constructor(urls, headers){
        this.urls = urls;
        this.headers = headers;  // authed
    }

    async get(){
        let photoUrls = [];
        for(let i = 0; i < this.urls.length; i++){
            let url = this.urls[i];
            console.log(`photo url: ${url}`);
            // authed ヘッダ付けると失敗する
            let r = await fetch(url);
            const b = await r.blob();
            console.log(b);
            const fd = new FormData();
            fd.append('photo', b);
            r = await fetch(
                'https://api.mercari.jp/services/photo/v1/upload',
                {
                    method: 'POST',
                    headers: this.headers,
                    body: fd
                }
            );
            const j = await r.json();
            photoUrls.push(j.data.path);
        }
        return photoUrls;
    }
}









