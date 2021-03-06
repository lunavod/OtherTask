import React from "react"
import { observer } from "mobx-react"
import { useMst } from "models/RootStore"
import SearchIcon from "assets/search.svg"
import PlusIcon from "assets/plus.svg"
import TagMenu from "components/menus/TagMenu"

import styles from "./styles.styl"
import { useKeyListener } from "../../tools/hooks"

const TagsSelector = observer(({ selected, select, unselect, type }) => {
  if (!type) type = "TASK"
  let { tags, createTag } = useMst()
  const [search, setSearch] = React.useState("")

  let results = tags.filter(
    tag =>
      tag.name.startsWith(search) &&
      !selected.includes(tag) &&
      tag.type === type,
  )
  results.sort((a, b) => a.index - b.index)

  useKeyListener("Enter", () => {
    if (!results.length && !!search.length) {
      setSearch("")
      select(createTag(search, type))
    }
  })

  const onSelectClick = tag => select(tag)
  const onUnselectClick = tag => unselect(tag)
  const onAddClick = name => {
    setSearch("")
    select(createTag(name, type))
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchWrapper}>
        <SearchIcon />
        <input
          className={styles.search}
          placeholder={"Тэги"}
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus={true}
        />
      </div>
      <div className={styles.list}>
        <div className={styles.listTitle}>Выбраны:</div>
        {selected.map(tag => (
          <TagMenu
            tag={tag}
            key={`selected-${tag.name}`}
            className={styles.tagMenu}
          >
            <span className={styles.tag} onClick={() => onUnselectClick(tag)}>
              {tag.name}
            </span>
          </TagMenu>
        ))}
        {!selected.length && (
          <span className={styles.placeholder}>Нет тэгов</span>
        )}
      </div>
      <div className={styles.list}>
        <div className={styles.listTitle}>Поиск:</div>
        {results.map(tag => (
          <TagMenu
            tag={tag}
            key={`search-${tag.name}`}
            className={styles.tagMenu}
          >
            <span className={styles.tag} onClick={() => onSelectClick(tag)}>
              {tag.name}
            </span>
          </TagMenu>
        ))}
        {!results.length && !!search.length && (
          <span className={styles.add} onClick={() => onAddClick(search)}>
            {search}
            <PlusIcon className={styles.addIcon} />
          </span>
        )}
        {!results.length && search.length === 0 && (
          <span className={styles.placeholder}>Нет тэгов</span>
        )}
      </div>
    </div>
  )
})

export default TagsSelector
