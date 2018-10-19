const GROUP_ID = '364997627165697'
const TAB_URL = `https://www.facebook.com/groups/${GROUP_ID}/permalink`

chrome.notifications.onClicked.addListener(id => {
	chrome.tabs.create({url: `${TAB_URL}/${id}`})
  chrome.notifications.clear(id, () => {})
})

const $ = (target, selector) => target.querySelector(selector)
const $$ = (target, selector) => Array.from(target.querySelectorAll(selector))

const textTruncate = (str, length) => {
	const dots = str.length > length ? '...' : ''
	return `${str.substring(0, length)}${dots}`
}

const loadHTML = async url => {
	const response = await fetch(url)
	const text = await response.text()
	const html = text.match(/<div class="_4-u2 mbm _4mrt _5jmm _5pat _5v3q _4-u8".*/gm)

	return new DOMParser().parseFromString(html, 'text/html')
}

const postInfo = html => $$(html, '._4-u2.mbm._4mrt._5jmm._5pat._5v3q._4-u8')
	.map(post => {
		const id = $(post, 'span.y_f4m4jwr-b span.fsm.fwn.fcg > a._5pcq').href.split('/').slice(-2, -1)[0]
		const name = $(post, 'span.fwn.fcg a').textContent
		const timestamp = $(post, 'span.timestampContent').textContent
		const body = $(post, 'div[data-ad-preview=message]') ? $(post, 'div[data-ad-preview=message]').textContent.replace(/\s+/g, ' ') : ''

		return { name, id, timestamp, body }
	})

const savePostId = posts => {
	const id = posts.map(({ id }) => id)
	chrome.storage.local.set({id}, () => console.log('Đã lưu bài viết'))
}

const checkAndFilterIfExist = posts => new Promise((resolve, reject) => {
	chrome.storage.local.get('id', data => {
		const prevId = data.id || []
		const newPosts = posts.filter(post => !prevId.includes(post.id))

		if(newPosts.length > 0) {
			resolve(newPosts)
		  savePostId(posts)
    } else {
      reject('Không có bài viết mới')
    }
	})
})

const sendNotification = posts => {
	if(posts.length <= 0) return

	const options = {
		type: 'basic',
		title: `${posts[0].name} • ${posts[0].timestamp}`,
		message: textTruncate(posts[0].body, 75),
		iconUrl: 'icon.jpg'
	}

	chrome.notifications.create(posts[0].id, options)
	sendNotification(posts.slice(1))
}

const jnotify = () => {
  loadHTML(`https://www.facebook.com/groups/${GROUP_ID}/?sorting_setting=CHRONOLOGICAL`)
    .then(postInfo)
    .then(checkAndFilterIfExist)
    .then(sendNotification)
    .catch(console.log)
}

setTimeout(jnotify, 3000)
setInterval(jnotify, 300000)
