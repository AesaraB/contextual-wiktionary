for style in ./scss/*.scss; do
	filename=$(basename $style)
	sass --no-source-map "$style" "./${filename%.scss}.css"
done

for style in ./scss/themes/*.scss; do
	filename=$(basename $style)
	sass --no-source-map "$style" "./themes/${filename%.scss}.css"
done
