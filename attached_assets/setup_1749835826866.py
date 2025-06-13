
from setuptools import setup, find_packages

setup(
    name='auton_simulador',
    version='0.1.0',
    packages=find_packages(where='app'),
    package_dir={'': 'app'},
    install_requires=[
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'pydantic',
        'python-dotenv'
    ],
    entry_points={
        'console_scripts': [
            'auton=main:app'
        ]
    },
    include_package_data=True,
    zip_safe=False
)
