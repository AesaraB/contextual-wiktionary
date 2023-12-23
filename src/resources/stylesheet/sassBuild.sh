sass "./scss/main.scss" "./main.css"
sass "./scss/popup.scss" "./popup.css"

mkdir "./themes"
for style in ./scss/themes/*.scss; do
	sass "$style" "/themes/${style%.scss}.css"
done
