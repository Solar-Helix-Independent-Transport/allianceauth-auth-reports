import os

from setuptools import find_packages, setup

from authstats import __version__

install_requires = [
    'django-ninja>=0.19.1',
    'django-solo>=2.1.0'
]
with open(os.path.join(os.path.dirname(__file__), 'README.md')) as readme:
    README = readme.read()
os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))

setup(
    name='allianceauth-auth-stats',
    version=__version__,
    packages=find_packages(),
    include_package_data=True,
    install_requires=install_requires,
    license='MIT',
    description='Alliance Auth Plugin',
    long_description=README,
    long_description_content_type="text/markdown",
    url='https://github.com/pvyParts/allianceauth-corp-tools',
    author='AaronKable',
    author_email='aaronkable@gmail.com',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU General Public License v3 (GPLv3)',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3.6',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
)
