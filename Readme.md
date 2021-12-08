# split_page.js
split the container if one container content is too long  
## setup
1. include the script and css  
```html
	<link rel="stylesheet" href="/js/split_page.js/split_page.css" />
	<script src="/js/split_page.js/split_page.min.js"></script>
```

2. split page. for example  
```js
		let image_split_page = split_page_by_id("image_container", 20);
```
function split_page_by_id(container_id, item_pre_page = 20);  
container_id is the id of the container  
item_pre_page is how many items you want to display on each page  

you can set the page change listener. for example  
```js
		image_split_page.on_page_changed = register_lazy_load_for_all_image;
```

## notice
if the container you split is not set id, the split_page.js will generate  
an id for it's split page container in order to control it.  
if the container you split has an id, the split page container's id  
will be "<container_id>_split_page"
