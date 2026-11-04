# Proyecto : CompraTux

# Descripción de la aplicación web
- Se trata de un programa en linea donde se va a poder adquirir y vender productos que los estudiantes u otras personas promocionen en la pagina además de contar con un apartado de reseñas para cada producto
<div align="center">
<img width="345" height="300" alt="CompraTux_comprimida" src=img/Compratux.jpg />
</div>

| Equipo | Rol | Porcentaje |
| :--- | :--- | :---: |
| CHOQUE MENDOZA, ARNOLD MARCO ANTONIO | Desarrollador fullstack | 100% |
| CRUZ HUARACA, CLAUDIO FERNANDO | Desarrollador fullstack | 100% |
| PACHAO BELLIDO, PIERO FRANCO | Desarrollador fullstack | 100% |
| PANIORA QUISPE, KENNER RUBEN | Desarrollador fullstack | 100% |
| | **Total** | **100%** |

| Entregables | URL |
| :--- | :--- |
| Repositorio | https://github.com/ppachao-cmyk/mtx |
| **Informes**[^1] | |
|lab07 |https://github.com/ppachao-cmyk/ctx/blob/main/informes/proyecto/informe/IDWeb_lab07_avance_proyecto.pdf|
|lab08 |https://github.com/ppachao-cmyk/ctx/blob/main/informes/proyecto/informe/IDWeb_lab08_avance_proyecto.pdf|
|lab09 |https://github.com/ppachao-cmyk/ctx/blob/main/informes/proyecto/informe/IDWeb_lab09_avance_proyecto.pdf|
|Informe Final |https://github.com/ppachao-cmyk/ctx/blob/main/informes/proyecto/informe/IDWeb_proyecto_informe_final.pdf|


# Tecnología utilizada[^2]

| Ítem | Tecnología |
| :--- | :--- |
| **Desarrollo** | GNU/Linux |
| | Git |
| | Github |
| **Frontend** | HTML5 |
| | CSS3 |
| | JavaScript |
| **Backend** | NodeJS |
| | Express |
| | zod |
| | Thunder Client
| **BD** | SQL |
| | Supabase |
| **Despliegue** | Docker |
| | Netlify |
| | Vercel |
| | Render |
| | Railway |


# Modelo de Datos[^3]
<div style="text-align: center;">
  <img src="img/supabase_ctx.svg" alt="ctx" />
</div>


# Estructura del proyecto
```bash
proyecto/
├── backend
│   ├── confing
│       ├── constantes.js
│       ├── supabase.js
│   ├── controllers
│       ├── authController.js
│       ├── compraController.js
│       ├── perfilController.js
│       ├── productoController.js
│       ├── resenaController.js
│   ├── middlewares
│       ├── authMiddleware.js
│   ├── routes
│       ├── authRoutes.js
│       ├── compraRoutes.js
│       ├── perfilRoutes.js
│       ├── productoRoutes.js
│       ├── resenaRoutes.js
│   ├── sql
│       ├── schema.sql
│   ├── utils
│       ├── aNumero.js
│       ├── usuarioPublico.js
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── app.js
│   ├── package-lock.json
│   ├── package.json
│   └── README.md
├── frontend
│   ├── .gitignore
│   ├── index.html
│   ├── pub
│        ├── img
│        ├── js
│           ├── main.js
│        ├── fonts
│        ├── style
│           ├── style.css
│   ├── priv
│   ├── index.html
│   └── README.md
├── .gitignore
├── informes
│   ├── IDWeb_lab07_avance_proyecto.pdf
│   ├── IDWeb_lab08_avance_proyecto.pdf
│   ├── IDWeb_lab09_avance_proyecto.pdf
│   ├── IDWeb_proyecto_informe_final.pdf
└── README.md
```

# Referencias
- https://askubuntu.com/
- https://git-scm.com/
- https://github.com/
- https://www.vim.org/
- https://neovim.io/
- https://html.spec.whatwg.org/multipage/
- https://www.w3.org/TR/2001/WD-css3-roadmap-20010523/
- https://javascript.info/
- https://supabase.com/
- https://www.docker.com/
- https://www.netlify.com/
- https://vercel.com/
- https://render.com/
- https://railway.com/

[^1]: Los informes deben estar en el repositorio del grupo en un subdirectorio llamado 'informes'.
[^2]: Se debe utilizar tecnología para frontend: HTML5, CSS3, JS nativo, flexbox, Bootstrap y para backend: NodeJS + express.
[^3]: La base de datos debe estar en la nomenclatura y estándares explicados en clase, se puede usar, MySQL, PostgreSQL o Supabase.
