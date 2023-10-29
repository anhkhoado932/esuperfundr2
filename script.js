let page = 1;
const pageSize = 30;

function getArticles() {
    const queries = { page, pageSize };
    $("#search__form")
        .serializeArray()
        .map(function (x) {
            queries[x.name] = x.value;
        });

    $.ajax({
        url: "https://newsapi.org/v2/everything",
        type: "GET",
        headers: {
            "X-Api-Key": "d0c07a47f10a43d3b94c0fbcdace37f0",
        },
        data: queries,
        beforeSend: () => {
            $("#card__list").html(`
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
          `);
        },
        success: (data) => {
            const { totalResults, articles } = data;
            saveArticlesToLocalStorage(articles);
            renderPaginator(totalResults);
            renderArticles(articles);
        },
        error: (err) => {
            let content;
            switch (err.status) {
                case 400:
                case 426:
                    content = `
                        <div>Developer accounts are limited to a max of 100 results.</div>
                    `;
                    break;
                default:
                    content = "<div>Unexpected error occurs.</div>";
            }
            $("#card__list").html(content);
        },
    });
}

function renderArticles(articles) {
    const container = $("#card__list");
    if (!articles.length) {
        container.html(`<p>No article found. Please refine your search</p>`);
    }
    container.html(`
        ${articles.map((a, index) => renderArticle(a, index)).join("\n")}
    `);

    $(".article__card .read__more").click(function () {
        const id = $(this).attr("id");
        displayModal(id);
    });
}

function renderArticle(article, id) {
    const { title, urlToImage, description, author } = article;
    const image = urlToImage
        ? `<img src="${urlToImage}" class="card-img-top img-fluid" alt="Article Image">`
        : '<img class="card-img-top img-fluid" alt="No Image">';

    return `
    <div class="col mb-4">
        <div class="card h-100 article__card d-flex flex-column">
            <div class="card__image__container" style="height: 200px; overflow: hidden;">
                ${image}
            </div>
            <div class="card-body d-flex flex-column justify-content-between">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">${description}</p>
                <p class="card-text"><small class="text-muted">By ${author}</small></p>

                <div class="mt-auto" style="text-align:center">
                    <a id="${id}" href="#" class="btn btn-primary read__more mx-auto">Read More</a>
                </div>
            </div>
        </div>
    </div>
    `;
}

function renderPaginator(totalResults) {
    const paginator = $("#paginator");

    const prevDisabled = page <= 5;
    paginator.html(`
        <li class="page-item ${prevDisabled ? "disabled" : ""}">
            <span class="page-link">Previous</span>
        </li>
    `);

    const startIdx = Math.floor(page / 5) * 5 + 1;
    for (
        let i = startIdx;
        i <= Math.ceil(totalResults / pageSize) && i < startIdx + 5;
        i++
    ) {
        const active = i == page;
        paginator.append(`
            <li class="page-item ${
                active ? "active" : ""
            } paginator__options" value=${i}><a class="page-link" href="#">${i}</a></li>
        `);
    }

    const nextDisabled = page * pageSize >= totalResults;
    paginator.append(`
        <li class="page-item ${nextDisabled ? "disabled" : ""}">
            <span class="page-link">Next</span>
        </li>
    `);

    $(".paginator__options").on("click", function (e) {
        e.preventDefault();
        page = parseInt($(this).attr("value"));
        getArticles();
    });
}

function displayModal(id) {
    const article = getArticleFromLocalStorage(id);

    if (article) {
        const { title, url } = article;

        const modalContent = `
        <div class="modal fade" id="articleModal" tabindex="-1" aria-labelledby="articleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl h-100 modal-fullscreen-sm-down">
            <div class="modal-content h-100">
                <div class="modal-header">
                    <h5 class="modal-title" id="articleModalLabel">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="embed-responsive embed-responsive-16by9 h-100">
                        <iframe class="embed-responsive-item w-100 h-100" src="${url}" allowfullscreen onerror="showAlternateMessage()"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
        `;

        $("body").append(modalContent);

        $("#articleModal").modal("show");

        // Close the modal
        $("#articleModal").on("hidden.bs.modal", function (e) {
            $("#articleModal").remove();
        });
    }
}

function saveArticlesToLocalStorage(articles) {
    articles.forEach((article, index) => {
        localStorage.setItem(`article_${index}`, JSON.stringify(article));
    });
}

function getArticleFromLocalStorage(id) {
    return JSON.parse(localStorage.getItem(`article_${id}`));
}

function showAlternateMessage() {
    const alternateMessage = `
        <div class="alert alert-danger" role="alert">
            Post cannot be viewed
        </div>
    `;
    $('#articleModal .modal-body').html(alternateMessage);
}

$(document).ready(function () {
    getArticles();

    $("#search__form").on("submit", function (e) {
        e.preventDefault();
        getArticles();
    });
});
