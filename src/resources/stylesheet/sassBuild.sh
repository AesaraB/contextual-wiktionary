sass --no-source-map "./scss/main.scss" "./main.css"
sass --no-source-map "./scss/popup.scss" "./popup.css"

for style in ./scss/themes/*.scss; do
	filename=$(basename $style)
	sass --no-source-map "$style" "./themes/${filename%.scss}.css"
done
