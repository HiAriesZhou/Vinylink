from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
with ZipFile('artifacts/vinylink.zip', 'w', ZIP_DEFLATED) as archive:
    for path in sorted(Path('dist').glob('*')):
        archive.write(path, path.name)
print('Packaged artifacts/vinylink.zip')
